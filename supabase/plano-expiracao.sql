-- ============================================================
--  EXPIRAÇÃO DE PLANO — quando plano_expira vence, o anúncio
--  perde o plano (volta a "sem plano": cai no ranking e perde o selo),
--  mas continua ativo. Roda 1x/dia via pg_cron.
--  Idempotente.
-- ============================================================

-- 1) Função que rebaixa os planos vencidos.
--    SECURITY DEFINER + auth.uid() nulo => o trigger protect_profile
--    permite alterar o plano (contexto de servidor).
create or replace function public.expirar_planos()
returns void language sql security definer set search_path = public as $$
  update public.profiles
    set plano = null, plano_expira = null
    where plano_expira is not null and plano_expira < now();
$$;

-- 2) Agendamento diário (03:00). Precisa da extensão pg_cron.
--    Se der erro de "schema cron does not exist", habilite o pg_cron antes:
--    Dashboard do Supabase → Database → Extensions → ative "pg_cron".
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('expirar-planos')
      where exists (select 1 from cron.job where jobname = 'expirar-planos');
    perform cron.schedule('expirar-planos', '0 3 * * *', $cron$ select public.expirar_planos(); $cron$);
  end if;
end $$;

-- Dá pra rodar manualmente a qualquer momento:  select public.expirar_planos();
