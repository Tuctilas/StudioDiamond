-- ============================================================
--  PLANOS DE VITRINE (a modelo paga p/ aparecer / ter destaque).
--  Fluxo A: receita simples — quem paga é a anunciante.
--  Tiers: prata < ouro < diamante. Só admin define o plano
--  (depois que o pagamento for confirmado).
--  Idempotente.
-- ============================================================

alter table public.profiles
  add column if not exists plano text
    check (plano is null or plano in ('prata','ouro','diamante')),
  add column if not exists plano_expira timestamptz;

-- Ranking derivado do plano (para ordenar a vitrine). Coluna gerada.
do $$ begin
  alter table public.profiles
    add column plano_rank int generated always as (
      case plano when 'diamante' then 3 when 'ouro' then 2 when 'prata' then 1 else 0 end
    ) stored;
exception when duplicate_column then null; end $$;

create index if not exists profiles_plano_rank_idx
  on public.profiles(plano_rank desc, created_at desc) where status = 'active';

-- Proteção: anunciante não se auto-aprova, não se destaca e não muda o próprio plano.
create or replace function public.protect_profile()
returns trigger language plpgsql as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.destaque := false;
      new.plano := null;
      new.plano_expira := null;
    else
      if new.status = 'active' and old.status <> 'active' then
        new.status := old.status;            -- só o admin ativa
      end if;
      new.destaque := old.destaque;          -- só o admin destaca
      new.plano := old.plano;                -- só o admin define plano
      new.plano_expira := old.plano_expira;
    end if;
  end if;
  return new;
end $$;
