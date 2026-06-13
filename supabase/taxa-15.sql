-- ============================================================
--  Atualiza a taxa da plataforma sobre vendas de conteúdo VIP:
--  10% -> 15% (Ruby segue isento). Rode UMA vez no SQL Editor.
--  Só redefine a função; não toca em dados nem em assinaturas já feitas.
-- ============================================================

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
grant execute on function public.assinar_vip(uuid) to authenticated;
