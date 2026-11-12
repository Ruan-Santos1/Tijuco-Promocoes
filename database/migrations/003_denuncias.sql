-- Tijuco Promoções v1.2: denúncias de ofertas
-- Rode UMA vez em Supabase > SQL Editor > New query > Run
-- (rode antes o 002_clientes_fotos_exclusao_conta.sql, se ainda não rodou)

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

alter table public.denuncias enable row level security;

drop policy if exists "denuncias_insert_logado" on public.denuncias;
create policy "denuncias_insert_logado" on public.denuncias
  for insert to authenticated with check (auth.uid() = denunciante_id);

drop policy if exists "denuncias_select_proprio" on public.denuncias;
create policy "denuncias_select_proprio" on public.denuncias
  for select to authenticated using (auth.uid() = denunciante_id);

-- Com 3 denúncias pendentes de pessoas diferentes, a oferta é ocultada até a análise.
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

-- O lojista não consegue reativar uma oferta que está em análise.
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

-- Moderação: veja as denúncias em Table Editor > denuncias.
-- Depois de analisar, mude status para 'analisada' (a oferta pode voltar: ativa = true)
-- ou apague a promoção.
