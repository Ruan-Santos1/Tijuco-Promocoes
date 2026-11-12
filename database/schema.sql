-- Tijuco Promoções: estrutura completa do banco de dados (Supabase / PostgreSQL)
--
-- Use este arquivo para criar o banco do zero em um projeto novo do Supabase:
-- SQL Editor > New query > cole tudo > Run. Pode ser rodado mais de uma vez.
--
-- Em um banco que já existe, use os scripts de database/migrations/ (veja o README desta pasta).

-- =====================================================================
-- 1. TABELAS
-- =====================================================================

-- Dados públicos da loja (aparecem nas ofertas)
create table if not exists public.lojas (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_loja text not null,
  telefone text,
  categoria_loja text,
  endereco text,
  bairro text,
  cidade text not null default 'Ituiutaba',
  estado text not null default 'MG',
  horario text,
  instagram text,
  created_at timestamptz not null default now()
);

-- Dados privados da loja (CPF/CNPJ e responsável): só o próprio lojista enxerga
create table if not exists public.lojas_privado (
  id uuid primary key references auth.users(id) on delete cascade,
  documento text,
  responsavel text,
  aceitou_politica_em timestamptz,
  created_at timestamptz default now()
);

-- Clientes (contas que não são de loja)
create table if not exists public.clientes (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  aceitou_politica_em timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.promocoes (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas(id) on delete cascade,
  titulo text not null,
  descricao text,
  preco numeric,
  preco_original numeric,
  imagem_url text,
  categoria text,
  validade date,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_promocoes_loja_id on public.promocoes (loja_id);
create index if not exists idx_promocoes_ativas on public.promocoes (ativa);
create index if not exists idx_promocoes_categoria on public.promocoes (categoria);

create table if not exists public.favoritos (
  usuario_id uuid not null references auth.users(id) on delete cascade,
  promocao_id uuid not null references public.promocoes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (usuario_id, promocao_id)
);

create index if not exists idx_favoritos_promocao_id on public.favoritos (promocao_id);

-- Denúncias de ofertas
create table if not exists public.denuncias (
  id uuid primary key default gen_random_uuid(),
  promocao_id text not null,
  loja_id uuid,
  denunciante_id uuid not null references auth.users(id) on delete cascade,
  motivo text not null,
  detalhe text,
  status text not null default 'pendente',   -- pendente | analisada
  created_at timestamptz default now(),
  unique (promocao_id, denunciante_id)       -- uma denúncia por pessoa em cada oferta
);

-- =====================================================================
-- 2. SEGURANÇA (RLS): cada pessoa só altera o que é dela
-- =====================================================================

alter table public.lojas enable row level security;
alter table public.lojas_privado enable row level security;
alter table public.clientes enable row level security;
alter table public.promocoes enable row level security;
alter table public.favoritos enable row level security;
alter table public.denuncias enable row level security;

-- Lojas: leitura pública; o lojista gerencia o próprio perfil
drop policy if exists "lojas_select_publico" on public.lojas;
create policy "lojas_select_publico" on public.lojas
  for select to anon, authenticated using (true);

drop policy if exists "lojas_insert_proprio" on public.lojas;
create policy "lojas_insert_proprio" on public.lojas
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "lojas_update_proprio" on public.lojas;
create policy "lojas_update_proprio" on public.lojas
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "lojas_delete_proprio" on public.lojas;
create policy "lojas_delete_proprio" on public.lojas
  for delete to authenticated using ((select auth.uid()) = id);

-- Dados privados da loja
drop policy if exists "privado_select_proprio" on public.lojas_privado;
create policy "privado_select_proprio" on public.lojas_privado
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "privado_insert_proprio" on public.lojas_privado;
create policy "privado_insert_proprio" on public.lojas_privado
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "privado_update_proprio" on public.lojas_privado;
create policy "privado_update_proprio" on public.lojas_privado
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Clientes
drop policy if exists "clientes_select_proprio" on public.clientes;
create policy "clientes_select_proprio" on public.clientes
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "clientes_insert_proprio" on public.clientes;
create policy "clientes_insert_proprio" on public.clientes
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "clientes_update_proprio" on public.clientes;
create policy "clientes_update_proprio" on public.clientes
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Promoções: todos veem as ativas; o lojista vê e gerencia todas as suas
drop policy if exists "promocoes_select_ativas_ou_proprias" on public.promocoes;
create policy "promocoes_select_ativas_ou_proprias" on public.promocoes
  for select to anon, authenticated using (ativa = true or loja_id = (select auth.uid()));

drop policy if exists "promocoes_insert_proprio" on public.promocoes;
create policy "promocoes_insert_proprio" on public.promocoes
  for insert to authenticated with check ((select auth.uid()) = loja_id);

drop policy if exists "promocoes_update_proprio" on public.promocoes;
create policy "promocoes_update_proprio" on public.promocoes
  for update to authenticated using ((select auth.uid()) = loja_id) with check ((select auth.uid()) = loja_id);

drop policy if exists "promocoes_delete_proprio" on public.promocoes;
create policy "promocoes_delete_proprio" on public.promocoes
  for delete to authenticated using ((select auth.uid()) = loja_id);

-- Favoritos
drop policy if exists "favoritos_select_proprio" on public.favoritos;
create policy "favoritos_select_proprio" on public.favoritos
  for select to authenticated using ((select auth.uid()) = usuario_id);

drop policy if exists "favoritos_insert_proprio" on public.favoritos;
create policy "favoritos_insert_proprio" on public.favoritos
  for insert to authenticated with check ((select auth.uid()) = usuario_id);

drop policy if exists "favoritos_delete_proprio" on public.favoritos;
create policy "favoritos_delete_proprio" on public.favoritos
  for delete to authenticated using ((select auth.uid()) = usuario_id);

-- Denúncias: a pessoa envia e consulta apenas as próprias
drop policy if exists "denuncias_insert_logado" on public.denuncias;
create policy "denuncias_insert_logado" on public.denuncias
  for insert to authenticated with check ((select auth.uid()) = denunciante_id);

drop policy if exists "denuncias_select_proprio" on public.denuncias;
create policy "denuncias_select_proprio" on public.denuncias
  for select to authenticated using ((select auth.uid()) = denunciante_id);

-- =====================================================================
-- 3. FOTOS DAS OFERTAS (Storage)
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('promocoes', 'promocoes', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Cada lojista envia e apaga fotos apenas na própria pasta (<id do usuário>/arquivo.jpg)
drop policy if exists "fotos_insert_proprio" on storage.objects;
create policy "fotos_insert_proprio" on storage.objects for insert to authenticated
  with check (bucket_id = 'promocoes' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "fotos_delete_proprio" on storage.objects;
create policy "fotos_delete_proprio" on storage.objects for delete to authenticated
  using (bucket_id = 'promocoes' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- =====================================================================
-- 4. FUNÇÕES E GATILHOS
-- =====================================================================

-- Excluir a própria conta (direito de eliminação da LGPD)
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

-- Com 3 denúncias pendentes de pessoas diferentes, a oferta é ocultada até a análise
create or replace function public.ocultar_promocao_denunciada()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.denuncias where promocao_id = new.promocao_id and status = 'pendente') >= 3 then
    update public.promocoes set ativa = false where id::text = new.promocao_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_ocultar_promocao on public.denuncias;
create trigger trg_ocultar_promocao after insert on public.denuncias
  for each row execute function public.ocultar_promocao_denunciada();

-- O lojista não consegue reativar uma oferta que está em análise
create or replace function public.bloquear_reativacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.ativa and not old.ativa
     and (select count(*) from public.denuncias where promocao_id = old.id::text and status = 'pendente') >= 3 then
    raise exception 'Esta oferta está em análise por denúncias e não pode ser reativada agora.';
  end if;
  return new;
end $$;

drop trigger if exists trg_bloquear_reativacao on public.promocoes;
create trigger trg_bloquear_reativacao before update on public.promocoes
  for each row execute function public.bloquear_reativacao();

-- As funções de gatilho não devem ser chamadas diretamente pela API
revoke all on function public.ocultar_promocao_denunciada() from public, anon, authenticated;
revoke all on function public.bloquear_reativacao() from public, anon, authenticated;
