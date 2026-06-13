-- ============================================================
--  ELOGIOS (depoimentos do público) com moderação.
--  - Qualquer visitante pode ENVIAR (entra como 'pending').
--  - Público só LÊ os aprovados, e nunca vê o e-mail (view sem e-mail).
--  - Admin modera (aprova / descarta) e enxerga o e-mail.
--  Idempotente.
-- ============================================================

create table if not exists public.elogios (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,  -- opcional: elogio a uma modelo
  nome text,                          -- null/!'' => exibido como "Anônimo"
  email text,                         -- privado: nunca exposto publicamente
  mensagem text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
create index if not exists elogios_status_idx on public.elogios(status, created_at desc);
create index if not exists elogios_profile_idx on public.elogios(profile_id) where status = 'approved';
alter table public.elogios enable row level security;

-- INSERT liberado para qualquer um (o trigger força status='pending')
drop policy if exists "elogios: qualquer um envia" on public.elogios;
create policy "elogios: qualquer um envia" on public.elogios
  for insert with check (true);

-- Leitura do BASE table só para admin (público lê pela view abaixo)
drop policy if exists "elogios: admin le" on public.elogios;
create policy "elogios: admin le" on public.elogios
  for select using (public.has_role(auth.uid(),'admin'));

drop policy if exists "elogios: admin gerencia" on public.elogios;
create policy "elogios: admin gerencia" on public.elogios
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- Trigger: não-admin nunca define/altera o status manualmente
create or replace function public.protect_elogio()
returns trigger language plpgsql as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    if tg_op = 'INSERT' then
      new.status := 'pending';
    else
      new.status := old.status;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_elogio on public.elogios;
create trigger trg_protect_elogio before insert or update on public.elogios
  for each row execute function public.protect_elogio();

-- View pública: só aprovados, SEM e-mail. (owner = postgres => ignora RLS de propósito)
create or replace view public.elogios_publicos as
  select id, profile_id, nome, mensagem, created_at
  from public.elogios
  where status = 'approved';

grant select on public.elogios_publicos to anon, authenticated;
