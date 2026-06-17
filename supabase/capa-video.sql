-- ============================================================
--  Vídeo de capa na vitrine (a modelo pode usar um vídeo como
--  mídia principal, no lugar/à frente da foto de capa).
--  Vídeo vai no bucket público profile-photos (pasta do dono).
--  RLS de profiles já cobre: a dona edita o próprio perfil.
--  Rode no SQL Editor. Idempotente.
-- ============================================================

alter table public.profiles
  add column if not exists capa_video_url text;
