-- Tijuco Promoções: limpeza das regras de segurança e do Storage
-- Rode UMA vez em Supabase > SQL Editor > New query > Run
-- (rode antes o 003_denuncias.sql, se ainda não rodou)
--
-- O que este script faz:
--   1. Remove as regras (policies) duplicadas de lojas e promoções e recria um
--      conjunto único, com nomes padronizados. As permissões continuam as mesmas.
--   2. Troca auth.uid() por (select auth.uid()), que o Supabase recomenda por ser
--      avaliado uma vez por consulta em vez de uma vez por linha.
--   3. Limita o bucket de fotos a imagens de até 5 MB.
--   4. Remove a coluna antiga lojas.nome_responsavel, que está vazia. O nome do
--      responsável fica em lojas_privado, que não é público.
--   5. Impede que as funções de gatilho sejam chamadas diretamente pela API.

begin;

-- 1) Apaga todas as regras atuais das tabelas do app
do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('lojas', 'lojas_privado', 'clientes', 'promocoes', 'favoritos', 'denuncias')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 2) Recria um conjunto único de regras

-- Lojas: leitura pública; o lojista gerencia o próprio perfil
create policy "lojas_select_publico" on public.lojas
  for select to anon, authenticated using (true);
create policy "lojas_insert_proprio" on public.lojas
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "lojas_update_proprio" on public.lojas
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "lojas_delete_proprio" on public.lojas
  for delete to authenticated using ((select auth.uid()) = id);

-- Dados privados da loja
create policy "privado_select_proprio" on public.lojas_privado
  for select to authenticated using ((select auth.uid()) = id);
create policy "privado_insert_proprio" on public.lojas_privado
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "privado_update_proprio" on public.lojas_privado
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Clientes
create policy "clientes_select_proprio" on public.clientes
  for select to authenticated using ((select auth.uid()) = id);
create policy "clientes_insert_proprio" on public.clientes
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "clientes_update_proprio" on public.clientes
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Promoções: todos veem as ativas; o lojista vê e gerencia todas as suas
create policy "promocoes_select_ativas_ou_proprias" on public.promocoes
  for select to anon, authenticated using (ativa = true or loja_id = (select auth.uid()));
create policy "promocoes_insert_proprio" on public.promocoes
  for insert to authenticated with check ((select auth.uid()) = loja_id);
create policy "promocoes_update_proprio" on public.promocoes
  for update to authenticated using ((select auth.uid()) = loja_id) with check ((select auth.uid()) = loja_id);
create policy "promocoes_delete_proprio" on public.promocoes
  for delete to authenticated using ((select auth.uid()) = loja_id);

-- Favoritos
create policy "favoritos_select_proprio" on public.favoritos
  for select to authenticated using ((select auth.uid()) = usuario_id);
create policy "favoritos_insert_proprio" on public.favoritos
  for insert to authenticated with check ((select auth.uid()) = usuario_id);
create policy "favoritos_delete_proprio" on public.favoritos
  for delete to authenticated using ((select auth.uid()) = usuario_id);

-- Denúncias: a pessoa envia e consulta apenas as próprias
create policy "denuncias_insert_logado" on public.denuncias
  for insert to authenticated with check ((select auth.uid()) = denunciante_id);
create policy "denuncias_select_proprio" on public.denuncias
  for select to authenticated using ((select auth.uid()) = denunciante_id);

-- 3) Fotos das ofertas: só imagens, até 5 MB
update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'promocoes';

drop policy if exists "fotos_insert_proprio" on storage.objects;
create policy "fotos_insert_proprio" on storage.objects for insert to authenticated
  with check (bucket_id = 'promocoes' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "fotos_delete_proprio" on storage.objects;
create policy "fotos_delete_proprio" on storage.objects for delete to authenticated
  using (bucket_id = 'promocoes' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 4) Coluna antiga e vazia: o responsável fica em lojas_privado
alter table public.lojas drop column if exists nome_responsavel;

-- 5) Funções de gatilho não são chamadas pela API
revoke all on function public.ocultar_promocao_denunciada() from public, anon, authenticated;
revoke all on function public.bloquear_reativacao() from public, anon, authenticated;

commit;
