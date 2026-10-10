-- Mapa Sensorial — esquema inicial do MVP (ver SPEC.md)

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- unaccent não é IMMUTABLE; este invólucro permite usá-lo em índices.
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $$;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.categoria_lugar as enum (
  'shopping',
  'supermercado',
  'restaurante_cafe',
  'parque_praca',
  'saude',
  'cultura',
  'transporte',
  'servico_publico',
  'outros'
);

create type public.origem_lugar as enum ('osm', 'usuario');

-- ---------------------------------------------------------------------------
-- Usuários
-- O e-mail fica em auth.users. Nenhum dado de saúde é guardado aqui.
-- ---------------------------------------------------------------------------

create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 120),
  nome_publico text not null check (char_length(nome_publico) between 1 and 40),
  criado_em timestamptz not null default now()
);

alter table public.usuarios enable row level security;

create policy "usuário vê o próprio cadastro"
  on public.usuarios for select to authenticated
  using ((select auth.uid()) = id);

create policy "usuário edita o próprio cadastro"
  on public.usuarios for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Só o nome público é visível para todo mundo.
create view public.nomes_publicos
with (security_invoker = false) as
  select id, nome_publico from public.usuarios;

grant select on public.nomes_publicos to anon, authenticated;

-- Cria o registro em public.usuarios no cadastro (dados vêm de options.data).
create or replace function public.criar_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuarios (id, nome, nome_publico)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome_publico'), ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_usuario();

-- ---------------------------------------------------------------------------
-- Lugares
-- ---------------------------------------------------------------------------

create table public.lugares (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 200),
  categoria public.categoria_lugar not null,
  endereco text check (char_length(endereco) <= 300),
  bairro text check (char_length(bairro) <= 100),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  origem public.origem_lugar not null default 'usuario',
  osm_id text unique,
  criado_por uuid references public.usuarios (id) on delete set null,
  criado_em timestamptz not null default now()
);

create index lugares_busca_idx on public.lugares
  using gin (public.f_unaccent(lower(nome || ' ' || coalesce(endereco, '') || ' ' || coalesce(bairro, ''))) extensions.gin_trgm_ops);
create index lugares_categoria_idx on public.lugares (categoria);

alter table public.lugares enable row level security;

create policy "lugares são públicos"
  on public.lugares for select to anon, authenticated
  using (true);

create policy "pessoa logada adiciona lugar"
  on public.lugares for insert to authenticated
  with check (origem = 'usuario' and osm_id is null and criado_por = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Relatos
-- Intensidade: 0 = baixo, 1 = médio, 2 = alto, null = "não reparei".
-- ---------------------------------------------------------------------------

create table public.relatos (
  id uuid primary key default gen_random_uuid(),
  lugar_id uuid not null references public.lugares (id) on delete cascade,
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  som smallint check (som between 0 and 2),
  luz smallint check (luz between 0 and 2),
  cheiro smallint check (cheiro between 0 and 2),
  lotacao smallint check (lotacao between 0 and 2),
  visual smallint check (visual between 0 and 2),
  temperatura smallint check (temperatura between 0 and 2),
  sempre_assim boolean not null,
  data date,
  hora time,
  o_que_esperar text check (char_length(o_que_esperar) <= 1000),
  comentario text check (char_length(comentario) <= 2000),
  criado_em timestamptz not null default now(),
  editado_em timestamptz,
  constraint pelo_menos_um_estimulo check (
    num_nonnulls(som, luz, cheiro, lotacao, visual, temperatura) >= 1
  ),
  constraint quando_preenchido check (
    sempre_assim or (data is not null and hora is not null)
  )
);

create index relatos_lugar_idx on public.relatos (lugar_id, criado_em desc);
create index relatos_usuario_idx on public.relatos (usuario_id);

alter table public.relatos enable row level security;

create policy "relatos são públicos"
  on public.relatos for select to anon, authenticated
  using (true);

create policy "pessoa logada cria relato"
  on public.relatos for insert to authenticated
  with check (usuario_id = (select auth.uid()));

create policy "autor edita o relato"
  on public.relatos for update to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "autor apaga o relato"
  on public.relatos for delete to authenticated
  using (usuario_id = (select auth.uid()));

create or replace function public.marcar_edicao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.editado_em := now();
  new.criado_em := old.criado_em;
  new.usuario_id := old.usuario_id;
  new.lugar_id := old.lugar_id;
  return new;
end;
$$;

create trigger ao_editar_relato
  before update on public.relatos
  for each row execute function public.marcar_edicao();

-- ---------------------------------------------------------------------------
-- Denúncias (moderação manual pelo painel do Supabase no MVP)
-- ---------------------------------------------------------------------------

create table public.denuncias (
  id uuid primary key default gen_random_uuid(),
  relato_id uuid not null references public.relatos (id) on delete cascade,
  denunciante_id uuid references public.usuarios (id) on delete set null,
  motivo text not null check (char_length(motivo) between 1 and 1000),
  criado_em timestamptz not null default now(),
  resolvida boolean not null default false,
  unique (relato_id, denunciante_id)
);

alter table public.denuncias enable row level security;

create policy "pessoa logada denuncia"
  on public.denuncias for insert to authenticated
  with check (denunciante_id = (select auth.uid()) and resolvida = false);

-- ---------------------------------------------------------------------------
-- Busca
-- Lugares com relatos vêm primeiro; depois, os mais parecidos com o termo.
-- ---------------------------------------------------------------------------

create or replace function public.buscar_lugares(
  termo text default null,
  categorias public.categoria_lugar[] default null,
  limite int default 60
)
returns table (
  id uuid,
  nome text,
  categoria public.categoria_lugar,
  endereco text,
  bairro text,
  lat double precision,
  lng double precision,
  origem public.origem_lugar,
  total_relatos bigint
)
language sql
stable
set search_path = ''
as $$
  with t as (
    select public.f_unaccent(lower(trim(coalesce(termo, '')))) as q
  )
  select
    l.id, l.nome, l.categoria, l.endereco, l.bairro, l.lat, l.lng, l.origem,
    (select count(*) from public.relatos r where r.lugar_id = l.id) as total_relatos
  from public.lugares l, t
  where
    (t.q = '' or public.f_unaccent(lower(l.nome || ' ' || coalesce(l.endereco, '') || ' ' || coalesce(l.bairro, ''))) like '%' || t.q || '%')
    and (categorias is null or cardinality(categorias) = 0 or l.categoria = any (categorias))
  order by
    (select count(*) from public.relatos r where r.lugar_id = l.id) > 0 desc,
    case when t.q <> '' and public.f_unaccent(lower(l.nome)) like t.q || '%' then 0 else 1 end,
    l.nome
  limit least(greatest(limite, 1), 200);
$$;

grant execute on function public.buscar_lugares to anon, authenticated;
