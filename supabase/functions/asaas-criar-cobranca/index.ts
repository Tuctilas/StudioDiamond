// Edge Function: cria uma cobrança Pix no Asaas.
//   tipo = 'vip'   -> cliente assina o conteúdo VIP de uma modelo (default)
//   tipo = 'plano' -> a modelo paga o plano de vitrine
// O acesso/plano NÃO é liberado aqui — só depois do webhook confirmar
// (ver asaas-webhook + confirmar_pagamento_vip / confirmar_pagamento_plano).
//
// Secrets: ASAAS_API_KEY, ASAAS_BASE_URL
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY são injetados.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')!
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') ?? 'https://api-sandbox.asaas.com/v3'

const PRECOS_PLANO: Record<string, number> = { ruby: 1900, diamante: 1500, ouro: 800, prata: 400 }
const PROMO_VAGAS = 20
const PROMO_DESCONTO = 0.3

async function asaas(path: string, init: RequestInit = {}) {
  const r = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', access_token: ASAAS_API_KEY, ...(init.headers ?? {}) },
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data?.errors?.[0]?.description ?? `Asaas ${r.status}`)
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json()
    const tipo = body.tipo === 'plano' ? 'plano' : 'vip'
    const nome = String(body.nome ?? '').trim()
    const doc = String(body.cpfCnpj ?? '').replace(/\D/g, '')
    if (nome.length < 3 || (doc.length !== 11 && doc.length !== 14)) {
      return json({ error: 'Informe nome completo e um CPF/CNPJ válido.' }, 400)
    }

    // Identifica o usuário logado pelo JWT.
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: u } = await userClient.auth.getUser()
    const user = u?.user
    if (!user) return json({ error: 'Faça login para continuar.' }, 401)

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Cria cliente no Asaas + cobrança Pix + QR. Comum aos dois fluxos.
    async function gerarPix(value: number, description: string, externalReference: string) {
      const customer = await asaas('/customers', {
        method: 'POST',
        body: JSON.stringify({ name: nome, cpfCnpj: doc, email: user!.email }),
      })
      const hoje = new Date().toISOString().slice(0, 10)
      const cobranca = await asaas('/payments', {
        method: 'POST',
        body: JSON.stringify({
          customer: customer.id,
          billingType: 'PIX',
          value,
          dueDate: hoje,
          description,
          externalReference,
        }),
      })
      const pix = await asaas(`/payments/${cobranca.id}/pixQrCode`)
      return {
        customerId: customer.id,
        paymentId: cobranca.id,
        invoiceUrl: cobranca.invoiceUrl,
        pixPayload: pix.payload,
        pixImage: pix.encodedImage,
      }
    }

    if (tipo === 'plano') {
      const plano = String(body.plano ?? '')
      if (!(plano in PRECOS_PLANO)) return json({ error: 'Plano inválido.' }, 400)
      const { data: perfil } = await admin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!perfil) return json({ error: 'Crie seu perfil antes de contratar um plano.' }, 400)

      let valor = PRECOS_PLANO[plano]
      const { data: total } = await admin.rpc('total_cadastros')
      if (typeof total === 'number' && total < PROMO_VAGAS) {
        valor = Math.round((valor * (1 - PROMO_DESCONTO)) / 10) * 10 // 30% off no 1º mês
      }

      const r = await gerarPix(valor, `Plano ${plano} — Studio Diamond`, `plano:${perfil.id}:${plano}`)
      await admin.from('plan_charges').insert({
        profile_id: perfil.id,
        plano,
        asaas_payment_id: r.paymentId,
        asaas_customer_id: r.customerId,
        valor,
        status: 'pending',
      })
      return json({ paymentId: r.paymentId, invoiceUrl: r.invoiceUrl, pixPayload: r.pixPayload, pixImage: r.pixImage })
    }

    // tipo 'vip' (padrão): cliente assina o conteúdo de uma modelo
    const profile_id = body.profile_id
    if (!profile_id) return json({ error: 'profile_id é obrigatório.' }, 400)
    const { data: perfil } = await admin
      .from('profiles')
      .select('id, nome_exibicao, vip_ativo, vip_preco')
      .eq('id', profile_id)
      .maybeSingle()
    if (!perfil || !perfil.vip_ativo || perfil.vip_preco == null) {
      return json({ error: 'Conteúdo VIP indisponível para esta modelo.' }, 400)
    }
    const r = await gerarPix(
      Number(perfil.vip_preco),
      `Assinatura VIP — ${perfil.nome_exibicao}`,
      `${user.id}:${perfil.id}`,
    )
    await admin.from('vip_charges').insert({
      subscriber_id: user.id,
      profile_id: perfil.id,
      asaas_payment_id: r.paymentId,
      asaas_customer_id: r.customerId,
      valor: Number(perfil.vip_preco),
      status: 'pending',
    })
    return json({ paymentId: r.paymentId, invoiceUrl: r.invoiceUrl, pixPayload: r.pixPayload, pixImage: r.pixImage })
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
