// Edge Function: cria uma cobrança Pix no Asaas para uma assinatura VIP.
// O acesso ao conteúdo NÃO é liberado aqui — só depois do webhook confirmar
// o pagamento (ver asaas-webhook + confirmar_pagamento_vip).
//
// Secrets necessários (Supabase → Edge Functions → Secrets):
//   ASAAS_API_KEY   -> chave de API do Asaas (sandbox ou produção)
//   ASAAS_BASE_URL  -> ex.: https://api-sandbox.asaas.com/v3 (sandbox)
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já são injetados pelo Supabase.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')!
const ASAAS_BASE_URL = Deno.env.get('ASAAS_BASE_URL') ?? 'https://api-sandbox.asaas.com/v3'

async function asaas(path: string, init: RequestInit = {}) {
  const r = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      access_token: ASAAS_API_KEY,
      ...(init.headers ?? {}),
    },
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data?.errors?.[0]?.description ?? `Asaas ${r.status}`)
  return data
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { profile_id, nome, cpfCnpj } = await req.json()
    if (!profile_id || !nome || !cpfCnpj) {
      return json({ error: 'Informe profile_id, nome e cpfCnpj.' }, 400)
    }

    // Identifica o usuário logado pelo JWT do request.
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: u } = await userClient.auth.getUser()
    const user = u?.user
    if (!user) return json({ error: 'Faça login para assinar.' }, 401)

    // Cliente com service role para ler o perfil e gravar a cobrança.
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: perfil } = await admin
      .from('profiles')
      .select('id, nome_exibicao, vip_ativo, vip_preco, plano')
      .eq('id', profile_id)
      .maybeSingle()
    if (!perfil || !perfil.vip_ativo || perfil.vip_preco == null) {
      return json({ error: 'Conteúdo VIP indisponível para esta modelo.' }, 400)
    }

    // 1) cliente no Asaas
    const customer = await asaas('/customers', {
      method: 'POST',
      body: JSON.stringify({ name: nome, cpfCnpj, email: user.email }),
    })

    // 2) cobrança Pix (vence hoje)
    const hoje = new Date().toISOString().slice(0, 10)
    const cobranca = await asaas('/payments', {
      method: 'POST',
      body: JSON.stringify({
        customer: customer.id,
        billingType: 'PIX',
        value: Number(perfil.vip_preco),
        dueDate: hoje,
        description: `Assinatura VIP — ${perfil.nome_exibicao}`,
        externalReference: `${user.id}:${perfil.id}`,
      }),
    })

    // 3) QR Code / copia-e-cola do Pix
    const pix = await asaas(`/payments/${cobranca.id}/pixQrCode`)

    // 4) registra a cobrança (pending) — será confirmada pelo webhook
    await admin.from('vip_charges').insert({
      subscriber_id: user.id,
      profile_id: perfil.id,
      asaas_payment_id: cobranca.id,
      asaas_customer_id: customer.id,
      valor: Number(perfil.vip_preco),
      status: 'pending',
    })

    return json({
      paymentId: cobranca.id,
      invoiceUrl: cobranca.invoiceUrl,
      pixPayload: pix.payload, // copia-e-cola
      pixImage: pix.encodedImage, // base64 do QR
    })
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
