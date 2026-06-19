// Edge Function: recebe os eventos do Asaas (pagamento confirmado/recebido,
// estorno) e atualiza o banco. É o ÚNICO ponto que libera o acesso VIP.
//
// Configure no Asaas (Configurações → Webhooks):
//   URL: https://hnkviyzqwywztjkbzevr.supabase.co/functions/v1/asaas-webhook
//   Token de autenticação: o mesmo valor de ASAAS_WEBHOOK_TOKEN
//
// Secrets necessários:
//   ASAAS_WEBHOOK_TOKEN -> token que o Asaas envia no header de cada evento
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados pelo Supabase.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN')!

Deno.serve(async (req) => {
  // Valida o token que o Asaas envia (evita chamadas forjadas).
  const token = req.headers.get('asaas-access-token')
  if (!WEBHOOK_TOKEN || token !== WEBHOOK_TOKEN) {
    return new Response('unauthorized', { status: 401 })
  }

  let evento: any
  try {
    evento = await req.json()
  } catch {
    return new Response('bad request', { status: 400 })
  }

  const tipo = evento?.event as string | undefined
  const pagamento = evento?.payment
  const paymentId = pagamento?.id as string | undefined
  // Valor efetivamente pago (confere contra o cobrado nas funções de confirmação).
  const valorPago = pagamento?.value != null ? Number(pagamento.value) : null

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  if (paymentId) {
    if (tipo === 'PAYMENT_CONFIRMED' || tipo === 'PAYMENT_RECEIVED') {
      // Tenta confirmar como assinatura VIP e como plano — cada função é
      // no-op se o pagamento não estiver na tabela dela (idempotente).
      await admin.rpc('confirmar_pagamento_vip', { p_payment_id: paymentId, p_valor_pago: valorPago })
      await admin.rpc('confirmar_pagamento_plano', { p_payment_id: paymentId, p_valor_pago: valorPago })
    } else if (tipo === 'PAYMENT_REFUNDED' || tipo === 'PAYMENT_CHARGEBACK_REQUESTED') {
      await admin.from('vip_charges').update({ status: 'refunded' }).eq('asaas_payment_id', paymentId)
      await admin.from('plan_charges').update({ status: 'refunded' }).eq('asaas_payment_id', paymentId)
    }
  }

  // Sempre 200: o Asaas reenvia se não receber 200.
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
