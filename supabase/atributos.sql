-- ============================================================
--  ATRIBUTOS RICOS DO PERFIL (persona, serviços, conteúdo,
--  logística, idiomas, regras) + colunas físicas e fetiches novos.
--  Idempotente — pode rodar quantas vezes quiser.
-- ============================================================

-- 1) Colunas físicas / comerciais (valor único) em profiles
alter table public.profiles
  add column if not exists manequim text,
  add column if not exists biotipo text,
  add column if not exists cabelo text,
  add column if not exists olhos text,
  add column if not exists seios text,
  add column if not exists cintura text,
  add column if not exists quadril text,
  add column if not exists pes text,
  add column if not exists tatuagem text,
  add column if not exists piercing text,
  add column if not exists fumante text,
  add column if not exists signo text,
  add column if not exists nivel_cultural text,
  add column if not exists observacoes text,
  add column if not exists preco_2h numeric,
  add column if not exists preco_pernoite text;

-- 2) Fetiches novos (a tabela já existe; só ampliamos o seed)
insert into public.fetiches (slug, nome) values
  ('banho-chuva','Banho de chuva'),('banho-lingua','Banho de língua'),
  ('banho-dourado','Banho dourado'),('banho-prata','Banho de prata'),
  ('podolatria','Podolatria (pés)'),('fisting','Fisting'),
  ('role-play','Role play'),('bondage','Bondage leve'),('spanking','Spanking'),
  ('sexting','Sexting'),('exibicionismo','Exibicionismo'),
  ('lingerie','Lingerie / meia-calça'),('cosplay','Cosplay'),
  ('asmr','ASMR erótico'),('joi','JOI'),
  ('fantasia-enfermeira','Fantasia enfermeira'),('fantasia-colegial','Fantasia colegial'),
  ('fantasia-secretaria','Fantasia secretária'),('fantasia-policial','Fantasia policial')
on conflict (slug) do nothing;

-- 3) Tabela genérica de características (agrupadas por "grupo") + N:N
create table if not exists public.caracteristicas (
  id uuid primary key default gen_random_uuid(),
  grupo text not null,            -- persona | servico | conteudo | local | disponibilidade | cliente | idioma | regra
  slug text not null,
  nome text not null,
  ordem int not null default 0,
  unique (grupo, slug)
);
alter table public.caracteristicas enable row level security;
drop policy if exists "carac: leitura publica" on public.caracteristicas;
create policy "carac: leitura publica" on public.caracteristicas for select using (true);
drop policy if exists "carac: admin gerencia" on public.caracteristicas;
create policy "carac: admin gerencia" on public.caracteristicas
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create table if not exists public.profile_caracteristicas (
  profile_id uuid references public.profiles(id) on delete cascade,
  caracteristica_id uuid references public.caracteristicas(id) on delete cascade,
  primary key (profile_id, caracteristica_id)
);
alter table public.profile_caracteristicas enable row level security;
drop policy if exists "pcar: publico le" on public.profile_caracteristicas;
create policy "pcar: publico le" on public.profile_caracteristicas for select using (true);
drop policy if exists "pcar: dono gerencia" on public.profile_caracteristicas;
create policy "pcar: dono gerencia" on public.profile_caracteristicas
  for all using (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid())
  );
drop policy if exists "pcar: admin tudo" on public.profile_caracteristicas;
create policy "pcar: admin tudo" on public.profile_caracteristicas
  for all using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- 4) Seed das características
insert into public.caracteristicas (grupo, slug, nome, ordem) values
  -- Estilo / Persona
  ('persona','mininha','Mininha',1),('persona','mulher-fatal','Mulher Fatal',2),
  ('persona','namoradinha','Namoradinha',3),('persona','poderosa','Poderosa',4),
  ('persona','safadinha','Safadinha',5),('persona','gfe','GFE (Girlfriend Experience)',6),
  ('persona','dominadora','Dominadora',7),('persona','submissa','Submissa',8),
  ('persona','madura-milf','Madura / MILF',9),('persona','universitaria','Universitária',10),
  ('persona','acompanhante-luxo','Acompanhante de luxo',11),
  -- Serviços / Atendimento
  ('servico','vaginal','Sexo vaginal',1),('servico','oral-com','Oral com preservativo',2),
  ('servico','oral-sem','Oral sem preservativo',3),('servico','anal','Anal',4),
  ('servico','beijo-na-boca','Beijo na boca',5),('servico','massagem','Massagem',6),
  ('servico','garganta-profunda','Garganta profunda',7),('servico','pompoarismo','Pompoarismo',8),
  ('servico','squirt','Squirt',9),('servico','duplas','Duplas',10),
  ('servico','casais','Casais',11),('servico','festas','Festas',12),
  ('servico','despedida-solteiro','Despedida de solteiro',13),
  -- Conteúdo digital
  ('conteudo','fotos','Fotos',1),('conteudo','videos','Vídeos curtos',2),
  ('conteudo','lives','Lives',3),('conteudo','custom','Custom (sob demanda)',4),
  ('conteudo','pack-mensal','Pack mensal',5),('conteudo','videochamada','Chamada de vídeo privada',6),
  ('conteudo','audios','Áudios eróticos',7),('conteudo','sexting','Sexting',8),
  ('conteudo','venda-pecas','Venda de peças',9),
  -- Logística — onde atende
  ('local','prive','Privê',1),('local','hotel','Hotel',2),('local','motel','Motel',3),
  ('local','residencia','Residência',4),('local','escritorio','Escritório',5),
  -- Disponível para
  ('disponibilidade','atendimento-24h','24 horas',1),('disponibilidade','viagens','Viagens',2),
  ('disponibilidade','pernoite','Pernoite',3),('disponibilidade','eventos','Eventos',4),
  ('disponibilidade','jantares','Jantares',5),('disponibilidade','festas','Festas',6),
  -- Preferências do cliente — atende
  ('cliente','homens','Homens',1),('cliente','mulheres','Mulheres',2),
  ('cliente','casais','Casais',3),('cliente','trans','Trans',4),
  ('cliente','duplas','Duplas',5),('cliente','grupos','Grupos',6),
  -- Idiomas
  ('idioma','portugues','Português',1),('idioma','ingles','Inglês',2),
  ('idioma','espanhol','Espanhol',3),('idioma','frances','Francês',4),
  ('idioma','italiano','Italiano',5),
  -- Observações / Regras
  ('regra','nao-confidencial','Não atende números confidenciais',1),
  ('regra','responde-sms','Responde SMS',2),('regra','responde-whatsapp','Responde WhatsApp',3),
  ('regra','exige-foto','Exige foto',4),('regra','antecedencia','Exige agendamento com antecedência',5)
on conflict (grupo, slug) do nothing;
