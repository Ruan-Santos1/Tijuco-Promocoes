-- Tijuco Promoções: novos dados de cadastro do lojista
-- Rode UMA vez no Supabase: SQL Editor > New query > cole tudo > Run

-- 1) Dados públicos da loja (aparecem nos detalhes da promoção)
alter table public.lojas
  add column if not exists categoria_loja text,
  add column if not exists bairro text,
  add column if not exists endereco text,
  add column if not exists horario text,
  add column if not exists instagram text;

-- 2) Dados privados (CPF/CNPJ e responsável): só o próprio lojista enxerga
create table if not exists public.lojas_privado (
  id uuid primary key references auth.users(id) on delete cascade,
  documento text,
  responsavel text,
  created_at timestamptz default now()
);

alter table public.lojas_privado enable row level security;

drop policy if exists "privado_select_proprio" on public.lojas_privado;
create policy "privado_select_proprio" on public.lojas_privado
  for select to authenticated using (auth.uid() = id);

drop policy if exists "privado_insert_proprio" on public.lojas_privado;
create policy "privado_insert_proprio" on public.lojas_privado
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "privado_update_proprio" on public.lojas_privado;
create policy "privado_update_proprio" on public.lojas_privado
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 3) Permite ao lojista atualizar o próprio perfil
drop policy if exists "lojas_update_proprio" on public.lojas;
create policy "lojas_update_proprio" on public.lojas
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
