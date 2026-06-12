-- ============================================================
--  PLATAFORMA NOVA (app SSR) — rode UMA vez no SQL Editor.
--  Convive com as tabelas antigas (creators etc.); nada é apagado.
-- ============================================================

-- 1) Roles (tabela separada por segurança — nunca no profile)
do $$ begin
  create type public.app_role as enum ('admin','advertiser');
exception when duplicate_object then null; end $$;

create table if not exists public.user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role public.app_role not null,
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;

-- has_role: SECURITY DEFINER evita recursão nas políticas RLS
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

drop policy if exists "roles: leitura autenticada" on public.user_roles;
create policy "roles: leitura autenticada" on public.user_roles
  for select using (auth.uid() is not null);
drop policy if exists "roles: admin gerencia" on public.user_roles;
create policy "roles: admin gerencia" on public.user_roles
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 2) Cidades (capitais; seed abaixo)
create table if not exists public.cidades (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null,
  estado text not null
);
alter table public.cidades enable row level security;
drop policy if exists "cidades: leitura publica" on public.cidades;
create policy "cidades: leitura publica" on public.cidades for select using (true);
drop policy if exists "cidades: admin gerencia" on public.cidades;
create policy "cidades: admin gerencia" on public.cidades
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

insert into public.cidades (slug, nome, estado) values
  ('aracaju','Aracaju','SE'),('belem','Belém','PA'),('belo-horizonte','Belo Horizonte','MG'),
  ('boa-vista','Boa Vista','RR'),('brasilia','Brasília','DF'),('campo-grande','Campo Grande','MS'),
  ('cuiaba','Cuiabá','MT'),('curitiba','Curitiba','PR'),('florianopolis','Florianópolis','SC'),
  ('fortaleza','Fortaleza','CE'),('goiania','Goiânia','GO'),('joao-pessoa','João Pessoa','PB'),
  ('macapa','Macapá','AP'),('maceio','Maceió','AL'),('manaus','Manaus','AM'),
  ('natal','Natal','RN'),('palmas','Palmas','TO'),('porto-alegre','Porto Alegre','RS'),
  ('porto-velho','Porto Velho','RO'),('recife','Recife','PE'),('rio-branco','Rio Branco','AC'),
  ('rio-de-janeiro','Rio de Janeiro','RJ'),('salvador','Salvador','BA'),('sao-luis','São Luís','MA'),
  ('sao-paulo','São Paulo','SP'),('teresina','Teresina','PI'),('vitoria','Vitória','ES')
on conflict (slug) do nothing;

-- 3) Perfis das anunciantes
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  slug text unique not null,
  nome_exibicao text not null,
  idade int check (idade is null or idade >= 18),
  cidade text,                      -- slug da cidade (FK leve)
  bairro text,
  altura text,
  peso text,
  bio text,
  telefone text,
  whatsapp text,
  preco_hora numeric,
  status text not null default 'pending' check (status in ('pending','active','paused')),
  destaque boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_user_unique on public.profiles(user_id) where user_id is not null;
create index if not exists profiles_cidade_idx on public.profiles(cidade) where status = 'active';
alter table public.profiles enable row level security;

drop policy if exists "profiles: publico le ativos" on public.profiles;
create policy "profiles: publico le ativos" on public.profiles
  for select using (status = 'active' or auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
drop policy if exists "profiles: dono cria" on public.profiles;
create policy "profiles: dono cria" on public.profiles
  for insert with check (auth.uid() = user_id);
drop policy if exists "profiles: dono edita" on public.profiles;
create policy "profiles: dono edita" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "profiles: dono apaga" on public.profiles;
create policy "profiles: dono apaga" on public.profiles
  for delete using (auth.uid() = user_id);
drop policy if exists "profiles: admin tudo" on public.profiles;
create policy "profiles: admin tudo" on public.profiles
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- Proteção: anunciante não se auto-aprova nem se marca destaque
create or replace function public.protect_profile()
returns trigger language plpgsql as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.destaque := false;
    else
      if new.status = 'active' and old.status <> 'active' then
        new.status := old.status;           -- só o admin ativa
      end if;
      new.destaque := old.destaque;          -- só o admin destaca
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_profile on public.profiles;
create trigger trg_protect_profile before insert or update on public.profiles
  for each row execute function public.protect_profile();

-- 4) Fotos do perfil
create table if not exists public.profile_photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  url text not null,
  ordem int not null default 0,
  is_capa boolean not null default false
);
create index if not exists profile_photos_profile_idx on public.profile_photos(profile_id);
alter table public.profile_photos enable row level security;

drop policy if exists "fotos: publico le de ativos" on public.profile_photos;
create policy "fotos: publico le de ativos" on public.profile_photos
  for select using (
    exists (select 1 from public.profiles p where p.id = profile_id
            and (p.status = 'active' or p.user_id = auth.uid() or public.has_role(auth.uid(),'admin')))
  );
drop policy if exists "fotos: dono gerencia" on public.profile_photos;
create policy "fotos: dono gerencia" on public.profile_photos
  for all using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  );
drop policy if exists "fotos: admin tudo" on public.profile_photos;
create policy "fotos: admin tudo" on public.profile_photos
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 5) Categorias (loiras, morenas, ...) + N:N
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null
);
alter table public.categories enable row level security;
drop policy if exists "categorias: leitura publica" on public.categories;
create policy "categorias: leitura publica" on public.categories for select using (true);
drop policy if exists "categorias: admin gerencia" on public.categories;
create policy "categorias: admin gerencia" on public.categories
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

insert into public.categories (slug, nome) values
  ('loiras','Loiras'),('morenas','Morenas'),('ruivas','Ruivas'),
  ('negras','Negras'),('mulatas','Mulatas'),('orientais','Orientais'),('latinas','Latinas')
on conflict (slug) do nothing;

create table if not exists public.profile_categories (
  profile_id uuid references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (profile_id, category_id)
);
alter table public.profile_categories enable row level security;
drop policy if exists "pc: publico le" on public.profile_categories;
create policy "pc: publico le" on public.profile_categories for select using (true);
drop policy if exists "pc: dono gerencia" on public.profile_categories;
create policy "pc: dono gerencia" on public.profile_categories
  for all using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  );
drop policy if exists "pc: admin tudo" on public.profile_categories;
create policy "pc: admin tudo" on public.profile_categories
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 6) Storage: bucket público de fotos (escrita só na pasta do dono)
insert into storage.buckets (id, name, public, file_size_limit)
values ('profile-photos','profile-photos', true, 104857600)   -- 100 MB
on conflict (id) do update set public = true, file_size_limit = 104857600;

drop policy if exists "pp: leitura publica" on storage.objects;
create policy "pp: leitura publica" on storage.objects
  for select using (bucket_id = 'profile-photos');
drop policy if exists "pp: dono envia" on storage.objects;
create policy "pp: dono envia" on storage.objects
  for insert with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "pp: dono atualiza" on storage.objects;
create policy "pp: dono atualiza" on storage.objects
  for update using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "pp: dono exclui" on storage.objects;
create policy "pp: dono exclui" on storage.objects
  for delete using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
--  DEPOIS DE RODAR:
--  1. Crie sua conta de admin pelo /auth do app e rode:
--     insert into public.user_roles (user_id, role)
--       select id, 'admin' from auth.users where email = 'SEU_EMAIL_ADMIN';
--  2. (Opcional) migrar dados antigos de creators -> profiles:
--     veja app/supabase/migracao-creators.sql
-- ============================================================
