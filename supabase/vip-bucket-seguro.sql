-- ============================================================
--  SEGURANÇA — bucket vip-conteudo só para ASSINANTE ATIVO.
--  Substitui a policy antiga ("qualquer logado lê", que dependia
--  do path ficar escondido) por uma checagem real de assinatura.
--  Leitura liberada para: o dono (a pasta é o user_id da modelo),
--  o admin, ou quem tem vip_subscriptions ativo para aquela modelo.
--  Rode no SQL Editor. Idempotente.
-- ============================================================

drop policy if exists "vip-bkt: logado le" on storage.objects;
drop policy if exists "vip-bkt: assinante le" on storage.objects;

create policy "vip-bkt: assinante le" on storage.objects
  for select using (
    bucket_id = 'vip-conteudo' and (
      -- dono: a primeira pasta do path é o user_id de quem subiu (a modelo)
      (storage.foldername(name))[1] = auth.uid()::text
      -- admin
      or public.has_role(auth.uid(), 'admin')
      -- assinante com assinatura ATIVA da modelo dona da pasta
      or exists (
        select 1
        from public.profiles p
        join public.vip_subscriptions s on s.profile_id = p.id
        where p.user_id::text = (storage.foldername(name))[1]
          and s.subscriber_id = auth.uid()
          and s.expira > now()
      )
    )
  );
