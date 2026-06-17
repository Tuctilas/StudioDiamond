-- ============================================================
--  Vídeo no conteúdo COMUM (galeria pública), além de foto.
--  profile_photos passa a ter "tipo" (image|video).
--  Rode no SQL Editor. Idempotente.
-- ============================================================

alter table public.profile_photos
  add column if not exists tipo text not null default 'image'
    check (tipo in ('image', 'video'));
