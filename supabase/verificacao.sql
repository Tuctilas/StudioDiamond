-- ============================================================
--  VERIFICAÇÃO & TERMOS (blindagem jurídica do cadastro)
--  - Anunciante aceita termos (registro com data/hora).
--  - Envia documento + vídeo de verificação para um bucket PRIVADO
--    (só ela e o admin enxergam).
--  - Só o admin marca "verificado".
--  Idempotente.
-- ============================================================

-- ⚠️ SEGURANÇA (24/06/2026): documento_url e video_verificacao_url SAÍRAM de
-- profiles (vazavam os caminhos dos documentos na leitura pública). Foram pra
-- `profile_private` (RLS dono+admin) — ver supabase/profile-privado.sql.
-- termos_aceitos_em e verificado NÃO são sensíveis e continuam em profiles.
alter table public.profiles
  add column if not exists termos_aceitos_em timestamptz,
  add column if not exists verificado boolean not null default false;

-- Proteção: status/destaque/plano/verificado só o admin altera.
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
        new.status := old.status;
      end if;
      new.destaque := old.destaque;
      new.plano := old.plano;
      new.plano_expira := old.plano_expira;
      new.verificado := old.verificado;     -- só o admin verifica
    end if;
  end if;
  return new;
end $$;

-- Bucket PRIVADO para documentos e vídeo de verificação
insert into storage.buckets (id, name, public, file_size_limit)
values ('verificacao','verificacao', false, 52428800)   -- 50 MB, privado
on conflict (id) do update set public = false, file_size_limit = 52428800;

-- Leitura: só o dono (pasta = seu uid) ou admin
drop policy if exists "verif: dono ou admin le" on storage.objects;
create policy "verif: dono ou admin le" on storage.objects
  for select using (
    bucket_id = 'verificacao'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin'))
  );
-- Escrita: só o dono na própria pasta
drop policy if exists "verif: dono envia" on storage.objects;
create policy "verif: dono envia" on storage.objects
  for insert with check (
    bucket_id = 'verificacao' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "verif: dono atualiza" on storage.objects;
create policy "verif: dono atualiza" on storage.objects
  for update using (
    bucket_id = 'verificacao' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "verif: dono exclui" on storage.objects;
create policy "verif: dono exclui" on storage.objects
  for delete using (
    bucket_id = 'verificacao' and (storage.foldername(name))[1] = auth.uid()::text
  );
