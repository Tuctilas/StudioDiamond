-- ============================================================
--  DEPLOY — rode TUDO de uma vez no SQL Editor do Supabase.
--  Reúne, na ordem certa, as 3 migrations pendentes:
--    1) pix.sql              (chave Pix de recebimento)
--    2) taxa-15.sql          (taxa da plataforma 10% -> 15%)
--    3) contas-e-cancelar.sql (papel "cliente" + cancelamento)
--  Tudo idempotente — pode rodar mais de uma vez sem estragar nada.
--
--  Se o passo 3 reclamar "ALTER TYPE ... cannot run inside a
--  transaction block", rode SÓ a linha do "alter type ... add value
--  'cliente'" sozinha primeiro, depois rode este arquivo de novo.
-- ============================================================


-- ─────────────────────────────────────────────
-- 1) CHAVE PIX (recebimento de saques)
-- ─────────────────────────────────────────────
-- ⚠️ SEGURANÇA (24/06/2026): pix_tipo/pix_chave saíram de profiles (vazavam na
-- leitura pública). Agora em `profile_private`. Bloco neutralizado de propósito.
-- Ver supabase/profile-privado.sql.


-- ─────────────────────────────────────────────
-- 2) TAXA DA PLATAFORMA 15% (Ruby segue isento)
-- ─────────────────────────────────────────────
create or replace function public.assinar_vip(p_profile_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_plano text; v_preco numeric; v_ativo boolean; v_taxa numeric; v_liquido numeric;
begin
  if auth.uid() is null then raise exception 'É preciso estar logada para assinar'; end if;
  select plano, vip_preco, vip_ativo into v_plano, v_preco, v_ativo
    from public.profiles where id = p_profile_id;
  if not coalesce(v_ativo, false) or v_preco is null then
    raise exception 'Conteúdo VIP indisponível para esta modelo';
  end if;
  if v_plano is null or v_plano not in ('ouro','diamante','ruby') then
    raise exception 'O plano desta modelo não permite venda de conteúdo';
  end if;
  v_taxa := case when v_plano = 'ruby' then 0 else 15 end;     -- só Ruby é isento
  v_liquido := round(v_preco - (v_preco * v_taxa / 100.0), 2);

  insert into public.vip_subscriptions (subscriber_id, profile_id, inicio, expira)
    values (auth.uid(), p_profile_id, now(), now() + interval '30 days')
  on conflict (subscriber_id, profile_id) do update
    set inicio = now(),
        expira = greatest(public.vip_subscriptions.expira, now()) + interval '30 days';

  insert into public.wallet_entries (profile_id, tipo, valor, descricao, status)
    values (p_profile_id, 'credito', v_liquido, 'Assinatura VIP (líquido após taxa)', 'confirmado');
end $$;
-- ⚠️ SEGURANÇA (24/06/2026): assinar_vip liberava VIP de graça. Obsoleta — o
-- webhook (confirmar_pagamento_vip) é quem cria a assinatura após o pagamento.
-- Em vez de conceder execute, removemos a função. Ver supabase/seguranca-rpc.sql.
drop function if exists public.assinar_vip(uuid);


-- ─────────────────────────────────────────────
-- 3) CONTAS (papel "cliente") + CANCELAMENTO
-- ─────────────────────────────────────────────
alter type public.app_role add value if not exists 'cliente';

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.raw_user_meta_data->>'papel') in ('cliente','advertiser') then
    insert into public.user_roles (user_id, role)
    values (new.id, (new.raw_user_meta_data->>'papel')::public.app_role)
    on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.cancelar_vip(p_profile_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'É preciso estar logada'; end if;
  delete from public.vip_subscriptions
    where subscriber_id = auth.uid() and profile_id = p_profile_id;
end $$;
grant execute on function public.cancelar_vip(uuid) to authenticated;
