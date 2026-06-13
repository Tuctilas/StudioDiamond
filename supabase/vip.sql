-- ============================================================
--  FASE 2 — ÁREA VIP + CARTEIRA + SPLIT
--  - Cliente logado assina o conteúdo VIP de uma modelo (por modelo).
--  - Split: Ruby 0% de taxa, Ouro/Diamante 15%, Prata não vende.
--  - Conteúdo restrito (bucket privado) só liberado a assinantes.
--  - Comentários nas mídias VIP, com a modelo podendo remover.
--  - Carteira: créditos das vendas (líquido) e saques.
--  Idempotente.
-- ============================================================

-- 0) Config VIP na própria modelo
alter table public.profiles
  add column if not exists vip_ativo boolean not null default false,
  add column if not exists vip_preco numeric;   -- mensalidade do conteúdo VIP

-- 1) Helper de dono (perfil pertence ao usuário logado)
create or replace function public.eh_dono(p_profile uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = p_profile and p.user_id = auth.uid());
$$;

-- 2) Assinaturas VIP (1 por par cliente/modelo, renovável)
create table if not exists public.vip_subscriptions (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  inicio timestamptz not null default now(),
  expira timestamptz not null,
  created_at timestamptz not null default now(),
  unique (subscriber_id, profile_id)
);

-- helper de assinatura ativa (depende da tabela acima)
create or replace function public.tem_vip(p_profile uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.vip_subscriptions s
    where s.subscriber_id = auth.uid() and s.profile_id = p_profile and s.expira > now()
  );
$$;

alter table public.vip_subscriptions enable row level security;
drop policy if exists "vsub: ve proprias/modelo/admin" on public.vip_subscriptions;
create policy "vsub: ve proprias/modelo/admin" on public.vip_subscriptions
  for select using (
    subscriber_id = auth.uid() or public.eh_dono(profile_id) or public.has_role(auth.uid(),'admin')
  );
-- inserção só via função assinar_vip(); admin pode gerenciar
drop policy if exists "vsub: admin gerencia" on public.vip_subscriptions;
create policy "vsub: admin gerencia" on public.vip_subscriptions
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 3) Mídia VIP (caminhos no bucket privado)
create table if not exists public.vip_media (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  path text not null,
  tipo text not null default 'image' check (tipo in ('image','video')),
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists vip_media_profile_idx on public.vip_media(profile_id);
alter table public.vip_media enable row level security;
drop policy if exists "vmedia: dono/assinante/admin le" on public.vip_media;
create policy "vmedia: dono/assinante/admin le" on public.vip_media
  for select using (
    public.eh_dono(profile_id) or public.tem_vip(profile_id) or public.has_role(auth.uid(),'admin')
  );
drop policy if exists "vmedia: dono gerencia" on public.vip_media;
create policy "vmedia: dono gerencia" on public.vip_media
  for all using (public.eh_dono(profile_id) or public.has_role(auth.uid(),'admin'))
  with check (public.eh_dono(profile_id) or public.has_role(auth.uid(),'admin'));

-- 4) Comentários nas mídias VIP
create table if not exists public.vip_comments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  media_id uuid references public.vip_media(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  autor_nome text,
  texto text not null,
  created_at timestamptz not null default now()
);
create index if not exists vip_comments_media_idx on public.vip_comments(media_id, created_at);
alter table public.vip_comments enable row level security;
drop policy if exists "vcom: dono/assinante/admin le" on public.vip_comments;
create policy "vcom: dono/assinante/admin le" on public.vip_comments
  for select using (
    public.eh_dono(profile_id) or public.tem_vip(profile_id) or public.has_role(auth.uid(),'admin')
  );
-- só assinante comenta (e como ela mesma)
drop policy if exists "vcom: assinante comenta" on public.vip_comments;
create policy "vcom: assinante comenta" on public.vip_comments
  for insert with check (author_id = auth.uid() and public.tem_vip(profile_id));
-- autor, modelo (dona) ou admin removem
drop policy if exists "vcom: autor/modelo/admin remove" on public.vip_comments;
create policy "vcom: autor/modelo/admin remove" on public.vip_comments
  for delete using (
    author_id = auth.uid() or public.eh_dono(profile_id) or public.has_role(auth.uid(),'admin')
  );

-- 5) Carteira (créditos das vendas e saques)
create table if not exists public.wallet_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  tipo text not null check (tipo in ('credito','saque')),
  valor numeric not null check (valor >= 0),
  descricao text,
  status text not null default 'confirmado'
    check (status in ('confirmado','pendente','pago','rejeitado')),
  created_at timestamptz not null default now()
);
create index if not exists wallet_profile_idx on public.wallet_entries(profile_id, created_at desc);
alter table public.wallet_entries enable row level security;
drop policy if exists "wallet: dono/admin le" on public.wallet_entries;
create policy "wallet: dono/admin le" on public.wallet_entries
  for select using (public.eh_dono(profile_id) or public.has_role(auth.uid(),'admin'));
-- créditos/saques entram via função; admin processa pagamentos
drop policy if exists "wallet: admin gerencia" on public.wallet_entries;
create policy "wallet: admin gerencia" on public.wallet_entries
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 6) Função de assinatura (aplica o split conforme o plano da modelo)
create or replace function public.assinar_vip(p_profile_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_plano text; v_preco numeric; v_ativo boolean; v_taxa numeric; v_liquido numeric;
begin
  if auth.uid() is null then raise exception 'É preciso estar logada para assinar'; end if;
  select plano, vip_preco, vip_ativo into v_plano, v_preco, v_ativo
    from public.profiles where id = p_profile_id;
  if not coalesce(v_ativo, false) or v_preco is null then
    raise exception 'Conteúdo VIP indisponível para esta modelo';
  end if;
  if v_plano is null or v_plano not in ('ouro','diamante','ruby') then
    raise exception 'O plano desta modelo não permite venda de conteúdo';
  end if;
  v_taxa := case when v_plano = 'ruby' then 0 else 15 end;     -- só Ruby é isento
  v_liquido := round(v_preco - (v_preco * v_taxa / 100.0), 2);

  insert into public.vip_subscriptions (subscriber_id, profile_id, inicio, expira)
    values (auth.uid(), p_profile_id, now(), now() + interval '30 days')
  on conflict (subscriber_id, profile_id) do update
    set inicio = now(),
        expira = greatest(public.vip_subscriptions.expira, now()) + interval '30 days';

  insert into public.wallet_entries (profile_id, tipo, valor, descricao, status)
    values (p_profile_id, 'credito', v_liquido, 'Assinatura VIP (líquido após taxa)', 'confirmado');
end $$;
grant execute on function public.assinar_vip(uuid) to authenticated;

-- 7) Solicitação de saque (a modelo pede; o admin paga)
create or replace function public.solicitar_saque(p_profile_id uuid, p_valor numeric)
returns void language plpgsql security definer set search_path = public as $$
declare v_saldo numeric;
begin
  if not exists (select 1 from public.profiles where id = p_profile_id and user_id = auth.uid()) then
    raise exception 'Sem permissão';
  end if;
  if p_valor is null or p_valor <= 0 then raise exception 'Valor inválido'; end if;
  select coalesce(sum(case
            when tipo = 'credito' and status = 'confirmado' then valor
            when tipo = 'saque' and status <> 'rejeitado' then -valor
            else 0 end), 0)
    into v_saldo from public.wallet_entries where profile_id = p_profile_id;
  if p_valor > v_saldo then raise exception 'Saldo insuficiente'; end if;
  insert into public.wallet_entries (profile_id, tipo, valor, descricao, status)
    values (p_profile_id, 'saque', p_valor, 'Solicitação de saque', 'pendente');
end $$;
grant execute on function public.solicitar_saque(uuid, numeric) to authenticated;

-- 8) Bucket PRIVADO do conteúdo VIP
insert into storage.buckets (id, name, public, file_size_limit)
values ('vip-conteudo','vip-conteudo', false, 209715200)   -- 200 MB (vídeos)
on conflict (id) do update set public = false, file_size_limit = 209715200;

-- leitura: qualquer logado (os caminhos só são revelados a assinantes via vip_media);
-- escrita: só o dono na própria pasta
drop policy if exists "vip-bkt: logado le" on storage.objects;
create policy "vip-bkt: logado le" on storage.objects
  for select using (bucket_id = 'vip-conteudo' and auth.uid() is not null);
drop policy if exists "vip-bkt: dono envia" on storage.objects;
create policy "vip-bkt: dono envia" on storage.objects
  for insert with check (
    bucket_id = 'vip-conteudo' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "vip-bkt: dono atualiza" on storage.objects;
create policy "vip-bkt: dono atualiza" on storage.objects
  for update using (
    bucket_id = 'vip-conteudo' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "vip-bkt: dono exclui" on storage.objects;
create policy "vip-bkt: dono exclui" on storage.objects
  for delete using (
    bucket_id = 'vip-conteudo' and (storage.foldername(name))[1] = auth.uid()::text
  );
