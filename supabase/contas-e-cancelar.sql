-- ============================================================
--  Separação cliente x modelo + cancelamento de assinatura.
--  Rode UMA vez no SQL Editor. Idempotente.
-- ============================================================

-- 1) Novo papel "cliente" (quem assina; modelo = "advertiser")
alter type public.app_role add value if not exists 'cliente';

-- 2) Ao criar a conta, o papel escolhido no cadastro (metadata "papel")
--    vira uma linha em user_roles. Cobre cadastro com e sem confirmação
--    de e-mail (o trigger roda na criação do usuário em auth.users).
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

-- 3) Cancelar a própria assinatura VIP (remove o acesso).
--    Pagamento real (não-renovação no provedor) entra na Fase 3.
create or replace function public.cancelar_vip(p_profile_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'É preciso estar logada'; end if;
  delete from public.vip_subscriptions
    where subscriber_id = auth.uid() and profile_id = p_profile_id;
end $$;
grant execute on function public.cancelar_vip(uuid) to authenticated;
