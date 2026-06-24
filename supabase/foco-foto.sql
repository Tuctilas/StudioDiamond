-- ============================================================
--  PONTO DE FOCO DAS MÍDIAS — evita rosto cortado.
--  Cada foto/vídeo guarda onde está o "foco" (em %); a exibição usa
--  isso no object-position em vez de cortar sempre pelo centro.
--  Default 50/50 = centro (comportamento atual). Idempotente.
-- ============================================================

alter table public.profile_photos
  add column if not exists foco_x int not null default 50,
  add column if not exists foco_y int not null default 50;

alter table public.vip_media
  add column if not exists foco_x int not null default 50,
  add column if not exists foco_y int not null default 50;
