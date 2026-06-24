// Edge Function: paga um saque via Pix (transfer do Asaas) para a chave da modelo.
// Chamada pelo ADMIN, ao aprovar um saque pendente no painel.
//
// Secrets: ASAAS_API_KEY, ASAAS_BASE_URL (mesmos da cobrança).
// Verify JWT = OFF (a função valida o admin por dentro).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')!
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') ?? 'https://api-sandbox.asaas.com/v3'

// nosso pix_tipo -> tipo de chave do Asaas
const TIPO_ASAAS: Record<string, string> = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'EMAIL',
  telefone: 'PHONE',
  aleatoria: 'EVP',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { wallet_entry_id } = await req.json()
    if (!wallet_entry_id) return json({ error: 'wallet_entry_id é obrigatório.' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: u } = await userClient.auth.getUser()
    const user = u?.user
    if (!user) return json({ error: 'Não autenticado.' }, 401)

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // só admin pode pagar saque
    const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', user.id)
    if (!(roles ?? []).some((r: { role: string }) => r.role === 'admin')) {
      return json({ error: 'Apenas o admin pode pagar saques.' }, 403)
    }

    // Reserva o saque de forma atômica: só passa quem conseguir mudar
    // 'pendente' -> 'processando'. Bloqueia clique duplo / duas abas /
    // duas requisições simultâneas (cada uma sairia com um Pix).
    const { data: claimed } = await admin
      .from('wallet_entries')
      .update({ status: 'processando' })
      .eq('id', wallet_entry_id)
      .eq('tipo', 'saque')
      .eq('status', 'pendente')
      .select('id, profile_id, valor, tipo')
      .maybeSingle()
    if (!claimed) {
      // Ou não existe, ou outra requisição já o reservou/pagou.
      const { data: existe } = await admin
        .from('wallet_entries')
        .select('id')
        .eq('id', wallet_entry_id)
        .eq('tipo', 'saque')
        .maybeSingle()
      return existe
        ? json({ error: 'Este saque já está sendo processado ou já foi pago.' }, 409)
        : json({ error: 'Saque não encontrado.' }, 404)
    }
    const saque = claimed

    // nome (profiles) + chave Pix (profile_private) da modelo
    const { data: perfil } = await admin
      .from('profiles')
      .select('nome_exibicao')
      .eq('id', saque.profile_id)
      .maybeSingle()
    const { data: priv } = await admin
      .from('profile_private')
      .select('pix_tipo, pix_chave')
      .eq('profile_id', saque.profile_id)
      .maybeSingle()
    // Libera a reserva (volta a 'pendente') quando falhamos ANTES de o
    // Pix sair — assim o admin pode tentar de novo. Depois da transferência
    // bem-sucedida NUNCA revertemos (evita pagar duas vezes).
    const liberar = () =>
      admin.from('wallet_entries').update({ status: 'pendente' }).eq('id', saque.id)

    if (!priv?.pix_chave || !priv?.pix_tipo) {
      await liberar()
      return json({ error: 'A modelo não cadastrou a chave Pix.' }, 400)
    }
    const tipoAsaas = TIPO_ASAAS[priv.pix_tipo]
    if (!tipoAsaas) {
      await liberar()
      return json({ error: 'Tipo de chave Pix inválido.' }, 400)
    }

    // transferência Pix no Asaas (debita do saldo da plataforma).
    // externalReference = id do saque: idempotência no lado do Asaas, caso
    // a função seja reexecutada antes de marcarmos 'pago'.
    let r: Response
    let data: any
    try {
      r = await fetch(`${ASAAS_BASE_URL}/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', access_token: ASAAS_API_KEY },
        body: JSON.stringify({
          value: Number(saque.valor),
          operationType: 'PIX',
          pixAddressKey: priv.pix_chave,
          pixAddressKeyType: tipoAsaas,
          description: `Saque — ${perfil.nome_exibicao}`,
          externalReference: saque.id,
        }),
      })
      data = await r.json().catch(() => ({}))
    } catch (e) {
      // Rede caiu antes de sabermos se o Asaas recebeu: deixa em
      // 'processando' (NÃO libera) p/ o admin conferir e evitar pagar 2x.
      return json({ error: `Falha de rede ao falar com o Asaas: ${String((e as Error).message ?? e)}` }, 502)
    }
    if (!r.ok) {
      await liberar()
      return json({ error: data?.errors?.[0]?.description ?? `Asaas ${r.status}` }, 502)
    }

    // marca como pago
    await admin
      .from('wallet_entries')
      .update({ status: 'pago', descricao: `Saque pago via Pix (Asaas ${data.id ?? ''})` })
      .eq('id', saque.id)

    return json({ ok: true, transferId: data.id ?? null })
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
