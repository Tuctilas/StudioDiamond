-- ============================================================
--  FASE 3 — PAGAMENTO REAL (Asaas) — backbone no banco.
--  Modelo v1: cliente paga Pix p/ a conta da plataforma; o webhook
--  confirma e só então libera o VIP + credita a carteira (85%).
--  Rode no SQL Editor. Idempotente.
-- ============================================================

-- 1) Cobranças VIP (uma por tentativa de assinatura via Asaas)
create table if not exists public.vip_charges (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  asaas_payment_id text unique,        -- id da cobrança no Asaas
  asaas_customer_id text,              -- id do cliente no Asaas
  valor numeric not null check (valor >= 0),
  status text not null default 'pending'
    check (status in ('pending','confirmed','failed','refunded')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists vip_charges_sub_idx on public.vip_charges(subscriber_id, created_at desc);
alter table public.vip_charges enable row level security;

-- O assinante enxerga as próprias cobranças (a UI usa p/ saber se confirmou).
drop policy if exists "vcharges: assinante le" on public.vip_charges;
create policy "vcharges: assinante le" on public.vip_charges
  for select using (subscriber_id = auth.uid() or public.has_role(auth.uid(),'admin'));
-- Escrita é só pelas Edge Functions (service_role ignora RLS) ou admin.
drop policy if exists "vcharges: admin gerencia" on public.vip_charges;
create policy "vcharges: admin gerencia" on public.vip_charges
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 2) Confirmação do pagamento (chamada pelo webhook, via service_role).
--    Idempotente: webhooks podem chegar repetidos.
create or replace function public.confirmar_pagamento_vip(p_payment_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_charge public.vip_charges%rowtype;
  v_plano text; v_taxa numeric; v_liquido numeric;
begin
  select * into v_charge from public.vip_charges
    where asaas_payment_id = p_payment_id for update;
  if not found then return; end if;                 -- cobrança desconhecida: ignora
  if v_charge.status = 'confirmed' then return; end if;  -- já processada: idempotente

  select plano into v_plano from public.profiles where id = v_charge.profile_id;
  v_taxa := case when v_plano = 'ruby' then 0 else 15 end;     -- só Ruby é isento
  v_liquido := round(v_charge.valor - (v_charge.valor * v_taxa / 100.0), 2);

  update public.vip_charges
    set status = 'confirmed', confirmed_at = now() where id = v_charge.id;

  -- libera o acesso por 30 dias (renova somando ao que faltava)
  insert into public.vip_subscriptions (subscriber_id, profile_id, inicio, expira)
    values (v_charge.subscriber_id, v_charge.profile_id, now(), now() + interval '30 days')
  on conflict (subscriber_id, profile_id) do update
    set inicio = now(),
        expira = greatest(public.vip_subscriptions.expira, now()) + interval '30 days';

  -- credita o líquido (85%) na carteira da modelo
  insert into public.wallet_entries (profile_id, tipo, valor, descricao, status)
    values (v_charge.profile_id, 'credito', v_liquido,
            'Assinatura VIP (líquido após taxa)', 'confirmado');
end $$;
grant execute on function public.confirmar_pagamento_vip(text) to service_role;

-- ============================================================
--  IMPORTANTE: a partir de agora a assinatura é liberada SÓ pelo
--  pagamento confirmado (webhook). A função antiga assinar_vip()
--  liberava de graça — revogamos o acesso dela ao público.
--  (Mantida no banco caso o admin queira cortesia manual.)
-- ============================================================
revoke execute on function public.assinar_vip(uuid) from authenticated;
