-- ============================================================
--  SEGURANÇA — fecha o EXECUTE público das funções sensíveis.
--
--  No Postgres TODA função nasce executável por PUBLIC. Um simples
--  `grant ... to service_role` NÃO remove isso. Resultado auditado
--  (24/06/2026): um ANÔNIMO conseguia chamar via API:
--    - confirmar_pagamento_vip / _plano / confirmar_presente
--      => confirmar cobrança SEM pagar (burlar todo o pagamento e
--         creditar carteira) — bastava omitir o valor.
--    - assinar_vip => VIP de graça.
--    - expirar_planos => rodar manutenção.
--  Aqui revogamos o PUBLIC e deixamos só quem deve.
--  Idempotente. Rode no SQL Editor.
--
--  ⚠️ Se reexecutar vip.sql / taxa-15.sql / _deploy-tudo.sql depois,
--     a função assinar_vip volta a existir — rode este arquivo de novo.
-- ============================================================

-- 1) Confirmação de pagamento + expiração: SÓ o servidor (service_role/webhook).
revoke execute on function public.confirmar_pagamento_vip(text, numeric)   from public, anon, authenticated;
revoke execute on function public.confirmar_pagamento_plano(text, numeric) from public, anon, authenticated;
revoke execute on function public.confirmar_presente(text, numeric)        from public, anon, authenticated;
revoke execute on function public.expirar_planos()                         from public, anon, authenticated;
grant  execute on function public.confirmar_pagamento_vip(text, numeric)   to service_role;
grant  execute on function public.confirmar_pagamento_plano(text, numeric) to service_role;
grant  execute on function public.confirmar_presente(text, numeric)        to service_role;
grant  execute on function public.expirar_planos()                         to service_role;

-- 2) assinar_vip liberava VIP de graça (o revoke só de "authenticated" feito
--    antes era inócuo, porque o PUBLIC continuava). Está obsoleta — quem cria
--    a assinatura hoje é o webhook (confirmar_pagamento_vip). Remove de vez.
drop function if exists public.assinar_vip(uuid);

-- 3) Funções de usuário: fora do anon/PUBLIC (já têm checagem de dono por
--    dentro, mas é defesa em profundidade). Só autenticado.
revoke execute on function public.solicitar_saque(uuid, numeric) from public, anon;
revoke execute on function public.cancelar_vip(uuid)             from public, anon;
revoke execute on function public.responder_presente(uuid, text) from public, anon;
grant  execute on function public.solicitar_saque(uuid, numeric) to authenticated;
grant  execute on function public.cancelar_vip(uuid)             to authenticated;
grant  execute on function public.responder_presente(uuid, text) to authenticated;
