-- Tijuco Promoções v1.1: rode UMA vez em Supabase > SQL Editor > New query > Run

-- 1) Clientes (separado das lojas)
create table if not exists public.clientes (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  aceitou_politica_em timestamptz,
  created_at timestamptz default now()
);
alter table public.clientes enable row level security;

drop policy if exists "clientes_select_proprio" on public.clientes;
create policy "clientes_select_proprio" on public.clientes for select to authenticated using (auth.uid() = id);
drop policy if exists "clientes_insert_proprio" on public.clientes;
create policy "clientes_insert_proprio" on public.clientes for insert to authenticated with check (auth.uid() = id);
drop policy if exists "clientes_update_proprio" on public.clientes;
create policy "clientes_update_proprio" on public.clientes for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 2) Colunas usadas pelo app
alter table public.lojas
  add column if not exists telefone text,
  add column if not exists cidade text,
  add column if not exists estado text,
  add column if not exists categoria_loja text,
  add column if not exists bairro text,
  add column if not exists endereco text,
  add column if not exists horario text,
  add column if not exists instagram text;

create table if not exists public.lojas_privado (
  id uuid primary key references auth.users(id) on delete cascade,
  documento text,
  responsavel text,
  created_at timestamptz default now()
);
alter table public.lojas_privado add column if not exists aceitou_politica_em timestamptz;
alter table public.lojas_privado enable row level security;

drop policy if exists "privado_select_proprio" on public.lojas_privado;
create policy "privado_select_proprio" on public.lojas_privado for select to authenticated using (auth.uid() = id);
drop policy if exists "privado_insert_proprio" on public.lojas_privado;
create policy "privado_insert_proprio" on public.lojas_privado for insert to authenticated with check (auth.uid() = id);
drop policy if exists "privado_update_proprio" on public.lojas_privado;
create policy "privado_update_proprio" on public.lojas_privado for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "lojas_insert_proprio" on public.lojas;
create policy "lojas_insert_proprio" on public.lojas for insert to authenticated with check (auth.uid() = id);
drop policy if exists "lojas_update_proprio" on public.lojas;
create policy "lojas_update_proprio" on public.lojas for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 3) Promoções: o lojista gerencia (ver, editar, pausar e excluir) as próprias ofertas
drop policy if exists "promocoes_select_proprio" on public.promocoes;
create policy "promocoes_select_proprio" on public.promocoes for select to authenticated using (auth.uid() = loja_id);
drop policy if exists "promocoes_insert_proprio" on public.promocoes;
create policy "promocoes_insert_proprio" on public.promocoes for insert to authenticated with check (auth.uid() = loja_id);
drop policy if exists "promocoes_update_proprio" on public.promocoes;
create policy "promocoes_update_proprio" on public.promocoes for update to authenticated using (auth.uid() = loja_id) with check (auth.uid() = loja_id);
drop policy if exists "promocoes_delete_proprio" on public.promocoes;
create policy "promocoes_delete_proprio" on public.promocoes for delete to authenticated using (auth.uid() = loja_id);

-- 4) Fotos das ofertas (Storage)
insert into storage.buckets (id, name, public) values ('promocoes', 'promocoes', true)
on conflict (id) do update set public = true;

drop policy if exists "fotos_insert_proprio" on storage.objects;
create policy "fotos_insert_proprio" on storage.objects for insert to authenticated
  with check (bucket_id = 'promocoes' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "fotos_delete_proprio" on storage.objects;
create policy "fotos_delete_proprio" on storage.objects for delete to authenticated
  using (bucket_id = 'promocoes' and (storage.foldername(name))[1] = auth.uid()::text);

-- 5) Excluir a própria conta (direito de eliminação da LGPD)
create or replace function public.excluir_minha_conta()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Não autenticado'; end if;
  delete from public.favoritos where usuario_id = uid;
  delete from public.promocoes where loja_id = uid;
  delete from public.lojas_privado where id = uid;
  delete from public.lojas where id = uid;
  delete from public.clientes where id = uid;
  delete from auth.users where id = uid;
end $$;
revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
