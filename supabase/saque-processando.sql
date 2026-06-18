-- ============================================================
--  SAQUE — estado 'processando' (reserva atômica anti-pagamento-duplo).
--  A função asaas-saque muda 'pendente' -> 'processando' de forma
--  atômica antes de chamar o Asaas; só quem consegue a troca paga.
--  Rode UMA vez no SQL Editor. Idempotente.
-- ============================================================

alter table public.wallet_entries
  drop constraint if exists wallet_entries_status_check;

alter table public.wallet_entries
  add constraint wallet_entries_status_check
    check (status in ('confirmado','pendente','processando','pago','rejeitado'));
