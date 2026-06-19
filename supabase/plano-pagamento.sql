-- ============================================================
--  FASE 3 — PAGAMENTO DO PLANO DE VITRINE (a modelo paga).
--  Pix via Asaas; ao confirmar, define o plano + validade 30 dias.
--  NÃO publica o perfil (status) — isso segue com o admin após verificar.
--  Rode no SQL Editor. Idempotente.
-- ============================================================

-- 1) Cobranças de plano (uma por tentativa de contratação)
create table if not exists public.plan_charges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  plano text not null check (plano in ('prata','ouro','diamante','ruby')),
  asaas_payment_id text unique,
  asaas_customer_id text,
  valor numeric not null check (valor >= 0),
  status text not null default 'pending'
    check (status in ('pending','confirmed','failed','refunded')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists plan_charges_profile_idx on public.plan_charges(profile_id, created_at desc);
alter table public.plan_charges enable row level security;

drop policy if exists "pcharges: dono le" on public.plan_charges;
create policy "pcharges: dono le" on public.plan_charges
  for select using (public.eh_dono(profile_id) or public.has_role(auth.uid(),'admin'));
drop policy if exists "pcharges: admin gerencia" on public.plan_charges;
create policy "pcharges: admin gerencia" on public.plan_charges
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 2) Permite que o servidor (service_role / webhook, onde auth.uid() é nulo)
--    altere campos protegidos. Modelo logada (auth.uid() != null) segue travada.
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
    else
      if new.status = 'active' and old.status <> 'active' then
        new.status := old.status;            -- só o admin ativa
      end if;
      new.destaque := old.destaque;          -- só o admin destaca
      new.plano := old.plano;                -- só o admin/servidor define plano
      new.plano_expira := old.plano_expira;
      new.verificado := old.verificado;      -- só o admin verifica
    end if;
  end if;
  return new;
end $$;

-- 3) Confirmação do pagamento do plano (chamada pelo webhook). Idempotente.
drop function if exists public.confirmar_pagamento_plano(text);
create or replace function public.confirmar_pagamento_plano(p_payment_id text, p_valor_pago numeric default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_charge public.plan_charges%rowtype;
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
end $$;
grant execute on function public.confirmar_pagamento_plano(text, numeric) to service_role;
