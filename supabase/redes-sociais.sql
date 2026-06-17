-- ============================================================
--  Redes sociais da modelo (aparecem no perfil só se tiverem link).
--  RLS de profiles já cobre: a dona edita o próprio perfil.
--  Rode no SQL Editor. Idempotente.
-- ============================================================

alter table public.profiles
  add column if not exists rede_instagram text,
  add column if not exists rede_twitter text,
  add column if not exists rede_tiktok text,
  add column if not exists rede_telegram text;
