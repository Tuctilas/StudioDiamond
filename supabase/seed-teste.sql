-- ============================================================
--  SEED DE TESTE — perfis fictícios para experimentar a vitrine,
--  filtros, planos/selos, assinatura VIP, carteira e sugestões.
--  Idempotente (slugs fixos). Para remover, veja o bloco no final.
--
--  OBS: o trigger protect_profile força status=pending / plano=null
--  quando quem insere não é admin (no SQL Editor auth.uid() é nulo).
--  Por isso desabilitamos o trigger só durante o seed.
--  plano_rank é coluna GERADA — não entra no insert.
-- ============================================================

alter table public.profiles disable trigger trg_protect_profile;

insert into public.profiles
  (slug, nome_exibicao, idade, cidade, bairro, altura, peso, bio,
   telefone, whatsapp, preco_hora, status, plano, verificado, destaque,
   vip_ativo, vip_preco, termos_aceitos_em)
values
  ('teste-marina','Marina Diamante',26,'sao-paulo','Jardins','1,70','58',
   'Perfil de teste — Marina. Elegante e discreta.',
   '11999990001','11999990001',600,'active','ruby',true,true, true, 90, now()),
  ('teste-juliana','Juliana Rocha',24,'sao-paulo','Moema','1,68','55',
   'Perfil de teste — Juliana.',
   '11999990002','11999990002',500,'active','diamante',true,false, true, 80, now()),
  ('teste-bianca','Bianca Loureiro',28,'sao-paulo','Pinheiros','1,72','60',
   'Perfil de teste — Bianca.',
   '11999990003','11999990003',450,'active','diamante',true,false, true, 70, now()),
  ('teste-larissa','Larissa Mendes',23,'sao-paulo','Itaim','1,65','52',
   'Perfil de teste — Larissa.',
   '11999990004','11999990004',350,'active','ouro',true,false, true, 60, now()),
  ('teste-sabrina','Sabrina Costa',27,'rio-de-janeiro','Copacabana','1,69','57',
   'Perfil de teste — Sabrina.',
   '21999990005','21999990005',400,'active','ouro',true,false, true, 50, now()),
  ('teste-carol','Carol Vasques',25,'belo-horizonte','Savassi','1,66','54',
   'Perfil de teste — Carol (plano Prata, sem VIP).',
   '31999990006','31999990006',300,'active','prata',true,false, false, null, now())
on conflict (slug) do nothing;

alter table public.profiles enable trigger trg_protect_profile;

-- Foto de capa (placeholder) para cada perfil de teste.
insert into public.profile_photos (profile_id, url, is_capa, ordem)
select p.id, 'https://picsum.photos/seed/' || p.slug || '/600/800', true, 0
from public.profiles p
where p.slug like 'teste-%'
  and not exists (select 1 from public.profile_photos pp where pp.profile_id = p.id);

-- Categorias (com sobreposição p/ testar as sugestões por categoria).
insert into public.profile_categories (profile_id, category_id)
select p.id, c.id
from public.profiles p
join (values
  ('teste-marina','morenas'),
  ('teste-juliana','morenas'),
  ('teste-sabrina','morenas'),
  ('teste-sabrina','latinas'),
  ('teste-bianca','loiras'),
  ('teste-larissa','loiras'),
  ('teste-carol','ruivas')
) as v(slug, categoria) on v.slug = p.slug
join public.categories c on c.slug = v.categoria
on conflict (profile_id, category_id) do nothing;

-- ============================================================
--  PARA REMOVER OS PERFIS DE TESTE depois (rode só este bloco):
--    delete from public.profiles where slug like 'teste-%';
--  (fotos, categorias e assinaturas caem em cascata.)
-- ============================================================
