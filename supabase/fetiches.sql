-- ============================================================
--  FILTRO DE FETICHES — rode UMA vez no SQL Editor do Supabase.
--  Idempotente (pode rodar de novo sem problema). Já incluído no
--  schema.sql; este arquivo serve para bancos já criados.
-- ============================================================

create table if not exists public.fetiches (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nome text not null
);
alter table public.fetiches enable row level security;
drop policy if exists "fetiches: leitura publica" on public.fetiches;
create policy "fetiches: leitura publica" on public.fetiches for select using (true);
drop policy if exists "fetiches: admin gerencia" on public.fetiches;
create policy "fetiches: admin gerencia" on public.fetiches
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

insert into public.fetiches (slug, nome) values
  ('namoradinha','Namoradinha (GFE)'),('beijo-na-boca','Beijo na boca'),('oral','Oral'),
  ('anal','Anal'),('massagem','Massagem'),('striptease','Striptease'),
  ('fantasias','Fantasias'),('dominacao','Dominação'),('submissao','Submissão'),
  ('fetichismo','Fetichismo'),('bdsm','BDSM / Sado'),('inversao','Inversão'),
  ('squirting','Squirting'),('sexo-virtual','Sexo virtual'),('voyeurismo','Voyeurismo'),
  ('despedida-solteiro','Despedida de solteiro'),('acompanhante-viagem','Acompanhante p/ viagem'),
  ('jantar','Jantar / Eventos')
on conflict (slug) do nothing;

create table if not exists public.profile_fetiches (
  profile_id uuid references public.profiles(id) on delete cascade,
  fetiche_id uuid references public.fetiches(id) on delete cascade,
  primary key (profile_id, fetiche_id)
);
alter table public.profile_fetiches enable row level security;
drop policy if exists "pf: publico le" on public.profile_fetiches;
create policy "pf: publico le" on public.profile_fetiches for select using (true);
drop policy if exists "pf: dono gerencia" on public.profile_fetiches;
create policy "pf: dono gerencia" on public.profile_fetiches
  for all using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  );
drop policy if exists "pf: admin tudo" on public.profile_fetiches;
create policy "pf: admin tudo" on public.profile_fetiches
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
