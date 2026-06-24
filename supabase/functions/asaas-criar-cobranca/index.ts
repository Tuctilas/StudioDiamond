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

const PRECOS_PLANO: Record<string, number> = { ruby: 490, diamante: 350, ouro: 190, prata: 90 }
// Leva fundadora — manter em sincronia com src/lib/planos.ts (FUNDADORA) e
// supabase/plano-fundadora.sql.
const FUNDADORA_PLANOS = new Set(['diamante', 'ouro', 'prata'])
const FUNDADORA_DESCONTO = 0.7
const FUNDADORA_VAGAS = 20
const FUNDADORA_MESES = 3

/** Valida CPF (11 díg.) ou CNPJ (14 díg.) pelos dígitos verificadores. */
function docValido(doc: string): boolean {
  if (doc.length === 11) return cpfValido(doc)
  if (doc.length === 14) return cnpjValido(doc)
  return false
}
function cpfValido(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false // todos os dígitos iguais
  const dig = (qtd: number) => {
    let soma = 0
    for (let i = 0; i < qtd; i++) soma += Number(cpf[i]) * (qtd + 1 - i)
    const r = (soma * 10) % 11
    return r === 10 ? 0 : r
  }
  return dig(9) === Number(cpf[9]) && dig(10) === Number(cpf[10])
}
function cnpjValido(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false
  const dig = (qtd: number) => {
    const pesos = qtd === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    let soma = 0
    for (let i = 0; i < qtd; i++) soma += Number(cnpj[i]) * pesos[i]
    const r = soma % 11
    return r < 2 ? 0 : 11 - r
  }
  return dig(12) === Number(cnpj[12]) && dig(13) === Number(cnpj[13])
}

/** Idade a partir de yyyy-mm-dd. Retorna -1 se a data for inválida. */
function idadeDe(nasc: string): number {
  if (!nasc) return -1
  const d = new Date(`${nasc}T00:00:00`)
  if (Number.isNaN(d.getTime())) return -1
  const hoje = new Date()
  let anos = hoje.getFullYear() - d.getFullYear()
  const m = hoje.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) anos--
  return anos
}

/** Remoção best-effort de telefone/@/link no recado (anti-desintermediação). */
function sanitizarRecado(txt: string): string {
  return txt
    .slice(0, 500)
    .replace(/https?:\/\/\S+/gi, '•••')
    .replace(/@[a-z0-9._]{2,}/gi, '•••')
    .replace(/[\d][\d\s().-]{6,}[\d]/g, (m) => (m.replace(/\D/g, '').length >= 8 ? '•••' : m))
    .trim()
}

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
    const tipo = body.tipo === 'plano' ? 'plano' : body.tipo === 'presente' ? 'presente' : 'vip'
    const nome = String(body.nome ?? '').trim()
    const doc = String(body.cpfCnpj ?? '').replace(/\D/g, '')
    if (nome.length < 3 || !docValido(doc)) {
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
        .select('id, fundadora')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!perfil) return json({ error: 'Crie seu perfil antes de contratar um plano.' }, 400)

      // Leva fundadora: 70% off nas 3 primeiras mensalidades das 20 primeiras
      // modelos que PAGAREM um plano (Ruby fora). A vaga só é cravada no webhook,
      // ao confirmar o pagamento — ver confirmar_pagamento_plano.
      let valor = PRECOS_PLANO[plano]
      let fundadoraCharge = false
      if (FUNDADORA_PLANOS.has(plano)) {
        const { count: mesesUsados } = await admin
          .from('plan_charges')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', perfil.id)
          .eq('fundadora', true)
          .eq('status', 'confirmed')
        let temVaga = perfil.fundadora === true
        if (!temVaga) {
          const { count: fundCount } = await admin
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('fundadora', true)
          temVaga = (fundCount ?? 0) < FUNDADORA_VAGAS
        }
        if (temVaga && (mesesUsados ?? 0) < FUNDADORA_MESES) {
          fundadoraCharge = true
          valor = Math.round(valor * (1 - FUNDADORA_DESCONTO) * 100) / 100
        }
      }

      const r = await gerarPix(valor, `Plano ${plano} — Studio Diamond`, `plano:${perfil.id}:${plano}`)
      await admin.from('plan_charges').insert({
        profile_id: perfil.id,
        plano,
        asaas_payment_id: r.paymentId,
        asaas_customer_id: r.customerId,
        valor,
        status: 'pending',
        fundadora: fundadoraCharge,
      })
      return json({ paymentId: r.paymentId, invoiceUrl: r.invoiceUrl, pixPayload: r.pixPayload, pixImage: r.pixImage })
    }

    if (tipo === 'presente') {
      // Conteúdo adulto: confirma 18+ pela data de nascimento (no servidor).
      if (idadeDe(String(body.dataNascimento ?? '')) < 18) {
        return json({ error: 'Conteúdo restrito a maiores de 18 anos.' }, 403)
      }
      const profile_id = body.profile_id
      const giftSlug = String(body.gift ?? '')
      if (!profile_id || !giftSlug) return json({ error: 'Presente ou perfil ausente.' }, 400)

      const { data: gift } = await admin
        .from('gifts')
        .select('id, nome, valor, ativo')
        .eq('slug', giftSlug)
        .maybeSingle()
      if (!gift || !gift.ativo) return json({ error: 'Presente indisponível.' }, 400)

      const { data: perfil } = await admin
        .from('profiles')
        .select('id, nome_exibicao, plano')
        .eq('id', profile_id)
        .maybeSingle()
      if (!perfil) return json({ error: 'Modelo não encontrada.' }, 400)
      if (!perfil.plano || !['ouro', 'diamante', 'ruby'].includes(perfil.plano)) {
        return json({ error: 'Esta modelo ainda não recebe presentes.' }, 400)
      }

      const apelido = String(body.apelido ?? '').trim().slice(0, 40)
      const anonimo = body.anonimo === true
      const mensagem = sanitizarRecado(String(body.mensagem ?? ''))

      const r = await gerarPix(
        Number(gift.valor),
        `Presente ${gift.nome} — ${perfil.nome_exibicao}`,
        `presente:${perfil.id}:${gift.id}`,
      )
      await admin.from('gift_sends').insert({
        sender_id: user.id,
        profile_id: perfil.id,
        gift_id: gift.id,
        valor: Number(gift.valor),
        sender_apelido: apelido || null,
        mensagem: mensagem || null,
        anonimo,
        asaas_payment_id: r.paymentId,
        asaas_customer_id: r.customerId,
        status: 'pending',
      })
      return json({ paymentId: r.paymentId, invoiceUrl: r.invoiceUrl, pixPayload: r.pixPayload, pixImage: r.pixImage })
    }

    // tipo 'vip' (padrão): cliente assina o conteúdo de uma modelo
    // Conteúdo adulto: confirma 18+ pela data de nascimento (também no servidor).
    if (idadeDe(String(body.dataNascimento ?? '')) < 18) {
      return json({ error: 'Conteúdo restrito a maiores de 18 anos.' }, 403)
    }
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
    // Observabilidade: registra a falha nos logs do Supabase (sem dados sensíveis).
    const msg = String((e as Error).message ?? e)
    console.error('asaas-criar-cobranca falhou:', msg)
    return json({ error: msg }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
