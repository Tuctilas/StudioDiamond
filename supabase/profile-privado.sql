-- ============================================================
--  DADOS PRIVADOS DO PERFIL — corrige vazamento de PII.
--  `profiles` é lida publicamente (SELECT * de perfil ativo), então
--  chave Pix/CPF e os caminhos dos documentos de verificação VAZAVAM.
--  Agora moram em `profile_private`, com RLS só do DONO + ADMIN.
--  Idempotente. Rode no SQL Editor.
--
--  ⚠️ NÃO reexecute pix.sql / verificacao.sql / _deploy-tudo.sql depois
--     disto: eles recriam essas colunas em profiles e o vazamento volta.
-- ============================================================

create table if not exists public.profile_private (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  pix_tipo text check (pix_tipo is null or pix_tipo in ('cpf','cnpj','email','telefone','aleatoria')),
  pix_chave text,
  documento_url text,
  video_verificacao_url text
);
alter table public.profile_private enable row level security;

-- Só o dono e o admin leem/escrevem (RLS é por linha — resolve dono x público).
drop policy if exists "ppriv: dono/admin le" on public.profile_private;
create policy "ppriv: dono/admin le" on public.profile_private
  for select using (public.eh_dono(profile_id) or public.has_role(auth.uid(),'admin'));
drop policy if exists "ppriv: dono insere" on public.profile_private;
create policy "ppriv: dono insere" on public.profile_private
  for insert with check (public.eh_dono(profile_id));
drop policy if exists "ppriv: dono atualiza" on public.profile_private;
create policy "ppriv: dono atualiza" on public.profile_private
  for update using (public.eh_dono(profile_id)) with check (public.eh_dono(profile_id));
drop policy if exists "ppriv: admin gerencia" on public.profile_private;
create policy "ppriv: admin gerencia" on public.profile_private
  for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

grant select, insert, update, delete on public.profile_private to authenticated, service_role;

-- Backfill: copia os dados existentes (só enquanto as colunas ainda existem).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'pix_chave'
  ) then
    insert into public.profile_private (profile_id, pix_tipo, pix_chave, documento_url, video_verificacao_url)
      select id, pix_tipo, pix_chave, documento_url, video_verificacao_url from public.profiles
    on conflict (profile_id) do update set
      pix_tipo = excluded.pix_tipo,
      pix_chave = excluded.pix_chave,
      documento_url = excluded.documento_url,
      video_verificacao_url = excluded.video_verificacao_url;
  end if;
end $$;

-- Remove de profiles — É ISTO que fecha o vazamento.
alter table public.profiles
  drop column if exists pix_tipo,
  drop column if exists pix_chave,
  drop column if exists documento_url,
  drop column if exists video_verificacao_url;
