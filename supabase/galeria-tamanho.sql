-- ============================================================
--  Tamanho manual de cada mídia na galeria (comum e VIP).
--  A modelo escolhe "pequeno" (1 coluna) ou "grande" (ocupa mais).
--  Rode no SQL Editor. Idempotente.
-- ============================================================

alter table public.profile_photos
  add column if not exists tamanho text not null default 'pequeno'
    check (tamanho in ('pequeno', 'grande'));

alter table public.vip_media
  add column if not exists tamanho text not null default 'pequeno'
    check (tamanho in ('pequeno', 'grande'));
