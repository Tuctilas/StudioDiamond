-- ============================================================
--  MIGRAÇÃO OPCIONAL: copia perfis aprovados do site antigo
--  (tabela creators) para a plataforma nova (profiles).
--  Rode DEPOIS do schema.sql. Pode rodar mais de uma vez
--  (ignora slugs já migrados).
-- ============================================================

insert into public.profiles
  (user_id, slug, nome_exibicao, idade, cidade, bairro, bio, whatsapp, preco_hora, status, destaque, created_at)
select
  c.owner,
  -- slug a partir do nome (sem acento/espacos) + 4 chars do id p/ unicidade
  lower(regexp_replace(translate(coalesce(c.name,'perfil'),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
    '[^a-zA-Z0-9]+','-','g')) || '-' || substr(c.id::text,1,4),
  coalesce(c.name,'Perfil'),
  nullif((c.attributes->>'idade'),'')::int,
  -- mapeia "Cidade · UF" para o slug da capital, se existir
  (select ci.slug from public.cidades ci
    where (c.attributes->>'cidade') ilike ci.nome || '%'
    limit 1),
  c.attributes->>'bairro',
  coalesce(c.description, c.bio),
  c.phone,
  nullif(regexp_replace(coalesce(c.access_price,''),'\D','','g'),'')::numeric,
  case when c.approved then 'active' else 'pending' end,
  coalesce(c.featured,false),
  coalesce(c.updated_at, now())
from public.creators c
where not exists (
  select 1 from public.profiles p
  where p.slug = lower(regexp_replace(translate(coalesce(c.name,'perfil'),
    'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ',
    'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'),
    '[^a-zA-Z0-9]+','-','g')) || '-' || substr(c.id::text,1,4)
);

-- fotos da galeria antiga (jsonb) -> profile_photos
insert into public.profile_photos (profile_id, url, ordem, is_capa)
select p.id, foto.url, foto.ord - 1, foto.ord = 1
from public.creators c
join public.profiles p on p.slug like '%' || substr(c.id::text,1,4)
cross join lateral (
  select
    case when jsonb_typeof(item) = 'object' then item->>'url' else trim(both '"' from item::text) end as url,
    row_number() over () as ord
  from jsonb_array_elements(coalesce(c.gallery,'[]'::jsonb)) item
) foto
where foto.url is not null and foto.url <> ''
  and not exists (select 1 from public.profile_photos ph where ph.profile_id = p.id);
