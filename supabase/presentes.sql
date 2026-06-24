-- ============================================================
--  PRESENTES (joias) — cliente envia presente pago via Pix pra
--  modelo, com recado; a modelo pode responder. Ranking público
--  de maiores doadores no perfil. Split igual ao VIP.
--  Pagamento real só é creditado pelo webhook (confirmar_presente).
--  Idempotente. Rode no SQL Editor.
-- ============================================================

-- 1) Catálogo de joias (valores em R$, cobrados direto por Pix).
create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  emoji text not null,
  valor numeric not null check (valor > 0),
  ordem int not null default 0,
  ativo boolean not null default true
);
alter table public.gifts enable row level security;
drop policy if exists "gifts: todos leem ativos" on public.gifts;
create policy "gifts: todos leem ativos" on public.gifts
  for select using (ativo or public.has_role(auth.uid(),'admin'));
drop policy if exists "gifts: admin gerencia" on public.gifts;
create policy "gifts: admin gerencia" on public.gifts
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

insert into public.gifts (slug, nome, emoji, valor, ordem) values
  ('rosa',     'Rosa',     '🌹', 5,   1),
  ('coracao',  'Coração',  '❤️', 15,  2),
  ('estrela',  'Estrela',  '⭐', 30,  3),
  ('diamante', 'Diamante', '💎', 75,  4),
  ('coroa',    'Coroa',    '👑', 150, 5),
  ('foguete',  'Foguete',  '🚀', 500, 6)
on conflict (slug) do update
  set nome = excluded.nome, emoji = excluded.emoji, valor = excluded.valor, ordem = excluded.ordem;

-- 2) Presentes enviados (uma linha por envio).
create table if not exists public.gift_sends (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  gift_id uuid not null references public.gifts(id),
  valor numeric not null check (valor >= 0),
  sender_apelido text,
  mensagem text,
  anonimo boolean not null default false,
  resposta text,
  respondido_at timestamptz,
  asaas_payment_id text unique,
  asaas_customer_id text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','failed','refunded')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists gift_sends_profile_idx on public.gift_sends(profile_id, status, created_at desc);
create index if not exists gift_sends_ranking_idx on public.gift_sends(profile_id, sender_id) where status = 'confirmed';
alter table public.gift_sends enable row level security;

-- Quem enviou lê os próprios (pra ver a resposta da modelo).
drop policy if exists "gsends: remetente le" on public.gift_sends;
create policy "gsends: remetente le" on public.gift_sends
  for select using (sender_id = auth.uid());
-- A modelo lê os presentes que recebeu (recados + responder).
drop policy if exists "gsends: dona le" on public.gift_sends;
create policy "gsends: dona le" on public.gift_sends
  for select using (public.eh_dono(profile_id) or public.has_role(auth.uid(),'admin'));
drop policy if exists "gsends: admin gerencia" on public.gift_sends;
create policy "gsends: admin gerencia" on public.gift_sends
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
-- (Inserção é só pelo servidor/webhook via service_role — sem policy de insert.)

-- 3) Ranking público de doadores (anônimos ficam de fora; soma só confirmados).
create or replace function public.ranking_doadores(p_profile_id uuid, p_limite int default 10)
returns table(apelido text, total numeric, qtd bigint)
language sql security definer set search_path = public stable as $$
  select coalesce(nullif(trim(max(sender_apelido)), ''), 'Apoiador') as apelido,
         sum(valor) as total,
         count(*) as qtd
  from public.gift_sends
  where profile_id = p_profile_id
    and status = 'confirmed'
    and not anonimo
  group by sender_id
  order by total desc
  limit greatest(1, least(p_limite, 50));
$$;
grant execute on function public.ranking_doadores(uuid, int) to anon, authenticated;

-- 4) Confirmação do presente (chamada pelo webhook). Credita a modelo
--    com o split do plano. Idempotente.
create or replace function public.confirmar_presente(p_payment_id text, p_valor_pago numeric default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v public.gift_sends%rowtype;
  v_plano text; v_taxa numeric; v_liquido numeric; v_nome text;
begin
  select * into v from public.gift_sends where asaas_payment_id = p_payment_id for update;
  if not found then return; end if;
  if v.status = 'confirmed' then return; end if;
  -- Defesa extra: só credita se o valor pago cobre o cobrado (tolerância 1 centavo).
  if p_valor_pago is not null and p_valor_pago + 0.01 < v.valor then return; end if;

  update public.gift_sends set status = 'confirmed', confirmed_at = now() where id = v.id;

  select plano into v_plano from public.profiles where id = v.profile_id;
  v_taxa := case when v_plano = 'ruby' then 0 else 15 end;   -- só Ruby é isento
  v_liquido := round(v.valor - (v.valor * v_taxa / 100.0), 2);
  select nome into v_nome from public.gifts where id = v.gift_id;

  insert into public.wallet_entries (profile_id, tipo, valor, descricao, status)
    values (v.profile_id, 'credito', v_liquido,
            'Presente: ' || coalesce(v_nome, 'joia') || ' (líquido após taxa)', 'confirmado');
end $$;
grant execute on function public.confirmar_presente(text, numeric) to service_role;

-- 5) A modelo responde um presente recebido.
create or replace function public.responder_presente(p_send_id uuid, p_texto text)
returns void language plpgsql security definer set search_path = public as $$
declare v_owner boolean;
begin
  if auth.uid() is null then raise exception 'É preciso estar logada'; end if;
  select public.eh_dono(profile_id) into v_owner from public.gift_sends where id = p_send_id;
  if not coalesce(v_owner, false) then raise exception 'Sem permissão'; end if;
  update public.gift_sends
    set resposta = nullif(left(trim(p_texto), 1000), ''), respondido_at = now()
    where id = p_send_id;
end $$;
grant execute on function public.responder_presente(uuid, text) to authenticated;
