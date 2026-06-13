-- ============================================================
--  PLANO RUBY (novo topo) + contador de cadastros p/ promoção.
--  Ranking: ruby(4) > diamante(3) > ouro(2) > prata(1).
--  Idempotente.
-- ============================================================

-- 1) check do plano agora aceita 'ruby'
alter table public.profiles drop constraint if exists profiles_plano_check;
alter table public.profiles
  add constraint profiles_plano_check
  check (plano is null or plano in ('prata','ouro','diamante','ruby'));

-- 2) recria a coluna gerada de ranking incluindo ruby
drop index if exists profiles_plano_rank_idx;
alter table public.profiles drop column if exists plano_rank;
alter table public.profiles
  add column plano_rank int generated always as (
    case plano when 'ruby' then 4 when 'diamante' then 3 when 'ouro' then 2 when 'prata' then 1 else 0 end
  ) stored;
create index if not exists profiles_plano_rank_idx
  on public.profiles(plano_rank desc, created_at desc) where status = 'active';

-- 3) total de cadastros (todos os status) p/ a promoção dos 20 primeiros.
--    SECURITY DEFINER: conta sem expor as linhas pendentes.
create or replace function public.total_cadastros()
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.profiles;
$$;
grant execute on function public.total_cadastros() to anon, authenticated;
