-- Problemas informados sobre lugares (lugares errados, fechados, duplicados, ofensivos)
-- e limites para quem adiciona lugares.
--
-- Regras automáticas (o resto vai para a fila de /moderacao):
--   - "ofensivo": 2 pessoas diferentes → o lugar sai do ar (oculto) até a revisão;
--   - "nao_existe": 3 pessoas diferentes → aviso "Pode ter fechado" (o lugar continua visível).
-- Arquivar (moderação) esconde o lugar sem apagar; dá para desfazer.

alter table public.lugares
  add column oculto boolean not null default false,
  add column arquivado boolean not null default false,
  add column talvez_fechado boolean not null default false;

create type public.motivo_problema_lugar as enum (
  'nao_existe', 'local_errado', 'nome_errado', 'duplicado', 'ofensivo', 'outro'
);

create table public.problemas_lugares (
  id uuid primary key default gen_random_uuid(),
  lugar_id uuid not null references public.lugares (id) on delete cascade,
  denunciante_id uuid references public.usuarios (id) on delete set null,
  motivo public.motivo_problema_lugar not null,
  detalhe text check (char_length(detalhe) <= 1000),
  criado_em timestamptz not null default now(),
  resolvido boolean not null default false,
  -- Cada pessoa informa cada motivo uma vez por lugar.
  unique (lugar_id, denunciante_id, motivo)
);

create index problemas_lugares_abertos_idx on public.problemas_lugares (lugar_id) where not resolvido;

alter table public.problemas_lugares enable row level security;

create policy "pessoa logada informa problema"
  on public.problemas_lugares for insert to authenticated
  with check (denunciante_id = (select auth.uid()) and resolvido = false);
-- Sem leitura pública: só a moderação (chave secreta) vê os problemas.

-- Regras automáticas ao informar um problema.
create or replace function public.aplicar_problema_lugar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pessoas int;
begin
  select count(distinct denunciante_id) into pessoas
    from public.problemas_lugares
   where lugar_id = new.lugar_id and motivo = new.motivo and not resolvido;

  if new.motivo = 'ofensivo' and pessoas >= 2 then
    update public.lugares set oculto = true where id = new.lugar_id;
  elsif new.motivo = 'nao_existe' and pessoas >= 3 then
    update public.lugares set talvez_fechado = true where id = new.lugar_id;
  end if;
  return new;
end;
$$;

create trigger problema_lugar_regras
  after insert on public.problemas_lugares
  for each row execute function public.aplicar_problema_lugar();

-- Lugares ocultos ou arquivados não aparecem (quem adicionou continua vendo o seu).
drop policy "lugares são públicos" on public.lugares;
create policy "lugares visíveis"
  on public.lugares for select to anon, authenticated
  using ((not oculto and not arquivado) or criado_por = (select auth.uid()));

-- Ninguém marca o próprio lugar como oculto, arquivado etc. ao criar.
drop policy "pessoa logada adiciona lugar" on public.lugares;
create policy "pessoa logada adiciona lugar"
  on public.lugares for insert to authenticated
  with check (
    origem = 'usuario' and osm_id is null and criado_por = (select auth.uid())
    and not oculto and not arquivado and not talvez_fechado
  );

-- Limite de lugares novos por pessoa por dia (como nos relatos).
create or replace function public.limitar_lugares()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  inicio timestamptz := ((now() at time zone 'America/Sao_Paulo')::date)::timestamp at time zone 'America/Sao_Paulo';
begin
  if current_user <> 'authenticated' then
    return new;
  end if;
  if (
    select count(*) from public.lugares
     where criado_por = new.criado_por and criado_em >= inicio
  ) >= 5 then
    raise exception 'limite_lugares_dia'
      using hint = 'Limite de 5 lugares novos por dia.';
  end if;
  return new;
end;
$$;

create trigger lugares_limite_dia
  before insert on public.lugares
  for each row execute function public.limitar_lugares();

create index if not exists lugares_criado_por_idx on public.lugares (criado_por, criado_em desc);

-- A busca devolve também o aviso "Pode ter fechado". O tipo de retorno muda: a função é recriada.
drop function if exists public.buscar_lugares(
  text, public.categoria_lugar[], double precision, double precision, double precision, double precision, int, text[], text
);

create function public.buscar_lugares(
  termo text default null,
  categorias public.categoria_lugar[] default null,
  sul double precision default null,
  oeste double precision default null,
  norte double precision default null,
  leste double precision default null,
  limite int default 100,
  subtipos text[] default null,
  palavra text default null
)
returns table (
  id uuid,
  nome text,
  categoria public.categoria_lugar,
  endereco text,
  bairro text,
  cidade text,
  uf text,
  lat double precision,
  lng double precision,
  origem public.origem_lugar,
  osm_id text,
  talvez_fechado boolean,
  total_relatos bigint
)
language sql
stable
set search_path = ''
as $$
  with t as (
    select
      public.f_unaccent(lower(trim(coalesce(termo, '')))) as q,
      public.f_unaccent(lower(trim(coalesce(palavra, '')))) as p
  ),
  candidatos as (
    select l.*,
      public.f_unaccent(lower(
        l.nome || ' ' || coalesce(l.endereco, '') || ' ' || coalesce(l.bairro, '') || ' ' || coalesce(l.cidade, '')
      )) as texto
    from public.lugares l, t
    where
      (categorias is null or cardinality(categorias) = 0 or l.categoria = any (categorias))
      and (sul is null or l.lat between sul and norte)
      and (oeste is null or l.lng between oeste and leste)
      and (
        subtipos is null or cardinality(subtipos) = 0
        or l.subtipo = any (subtipos)
        or (l.subtipo is null and l.origem = 'usuario')
        or (t.p <> '' and public.f_unaccent(lower(l.nome)) like '%' || t.p || '%')
      )
  ),
  exatos as (
    select c.* from candidatos c, t where t.q = '' or c.texto like '%' || t.q || '%'
  ),
  parecidos as (
    select c.* from candidatos c, t
    where t.q <> ''
      and char_length(t.q) >= 4
      and not exists (select 1 from exatos)
      and extensions.word_similarity(t.q, c.texto) >= 0.55
  ),
  resultado as (
    select e.*, 1::real as parecido from exatos e
    union all
    select p.*, extensions.word_similarity(t.q, p.texto) from parecidos p, t
  )
  select r.id, r.nome, r.categoria, r.endereco, r.bairro, r.cidade, r.uf, r.lat, r.lng, r.origem, r.osm_id, r.talvez_fechado,
    (select count(*) from public.relatos x where x.lugar_id = r.id and not x.oculto) as total_relatos
  from resultado r, t
  order by
    case when t.q <> '' and public.f_unaccent(lower(r.nome)) like t.q || '%' then 0 else 1 end,
    (select count(*) from public.relatos x where x.lugar_id = r.id and not x.oculto) > 0 desc,
    r.parecido desc,
    r.nome
  limit least(greatest(limite, 1), 200);
$$;

grant execute on function public.buscar_lugares to anon, authenticated;
