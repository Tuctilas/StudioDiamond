-- ============================================================
--  Chave Pix para recebimento de saques (prep da Fase 3).
--  Rode UMA vez no SQL Editor. Não apaga nada.
--  As políticas RLS de profiles já cobrem estes campos:
--  o dono edita o próprio perfil (policy "profiles: dono edita").
-- ============================================================

alter table public.profiles
  add column if not exists pix_tipo text
    check (pix_tipo is null or pix_tipo in ('cpf','cnpj','email','telefone','aleatoria')),
  add column if not exists pix_chave text;
