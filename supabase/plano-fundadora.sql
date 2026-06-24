-- ============================================================
--  LEVA FUNDADORA — promo de lançamento.
--  As 20 PRIMEIRAS modelos que PAGAREM um plano ganham 70% de
--  desconto nas 3 primeiras mensalidades (Diamante/Ouro/Prata).
--  Ruby fica de fora. A vaga só é cravada quando o pagamento é
--  confirmado pelo webhook (não no cadastro).
--  Idempotente. Rode no SQL Editor.
-- ============================================================

-- 1) Flags: 'fundadora' no perfil (vaga ocupada) e na cobrança (mês com desconto).
alter table public.profiles
  add column if not exists fundadora boolean not null default false;
alter table public.plan_charges
  add column if not exists fundadora boolean not null default false;

-- 2) protect_profile: só o servidor/admin define 'fundadora'.
--    (Base = versão de plano-pagamento.sql; adiciona o trava de 'fundadora'.)
create or replace function public.protect_profile()
returns trigger language plpgsql as $$
begin
  if auth.uid() is not null and not public.has_role(auth.uid(),'admin') then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.destaque := false;
      new.plano := null;
      new.plano_expira := null;
      new.verificado := false;
      new.fundadora := false;
    else
      if new.status = 'active' and old.status <> 'active' then
        new.status := old.status;            -- só o admin ativa
      end if;
      new.destaque := old.destaque;          -- só o admin destaca
      new.plano := old.plano;                -- só o admin/servidor define plano
      new.plano_expira := old.plano_expira;
      new.verificado := old.verificado;      -- só o admin verifica
      new.fundadora := old.fundadora;        -- só o servidor crava fundadora
    end if;
  end if;
  return new;
end $$;

-- 3) Quantas das 20 vagas de fundadora ainda restam (pública, pro site mostrar).
create or replace function public.fundadoras_restantes()
returns integer language sql security definer set search_path = public stable as $$
  select greatest(0, 20 - (select count(*) from public.profiles where fundadora))::int;
$$;
grant execute on function public.fundadoras_restantes() to anon, authenticated;

-- 4) Confirmação do plano: aplica o plano E crava a vaga de fundadora quando
--    uma cobrança fundadora é paga (respeitando o limite de 20). Idempotente.
create or replace function public.confirmar_pagamento_plano(p_payment_id text, p_valor_pago numeric default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_charge public.plan_charges%rowtype;
  v_ja_fund boolean;
  v_fund_count int;
begin
  select * into v_charge from public.plan_charges
    where asaas_payment_id = p_payment_id for update;
  if not found then return; end if;
  if v_charge.status = 'confirmed' then return; end if;
  -- Defesa extra: só libera o plano se o valor pago cobre o cobrado (tolerância 1 centavo).
  if p_valor_pago is not null and p_valor_pago + 0.01 < v_charge.valor then return; end if;

  update public.plan_charges
    set status = 'confirmed', confirmed_at = now() where id = v_charge.id;

  -- define o plano e soma 30 dias de validade (renovação acumula)
  update public.profiles
    set plano = v_charge.plano,
        plano_expira = greatest(coalesce(plano_expira, now()), now()) + interval '30 days'
    where id = v_charge.profile_id;

  -- Crava a vaga de fundadora no primeiro pagamento fundador confirmado (até 20).
  if v_charge.fundadora then
    select fundadora into v_ja_fund from public.profiles where id = v_charge.profile_id;
    if not coalesce(v_ja_fund, false) then
      select count(*) into v_fund_count from public.profiles where fundadora;
      if v_fund_count < 20 then
        update public.profiles set fundadora = true where id = v_charge.profile_id;
      end if;
    end if;
  end if;
end $$;
grant execute on function public.confirmar_pagamento_plano(text, numeric) to service_role;
