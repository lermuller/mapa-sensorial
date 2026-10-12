-- Lugares do Brasil todo: cidade e estado (UF) em cada lugar. Até aqui, todos eram de
-- Porto Alegre (importação do OSM e cadastro limitado à cidade).

alter table public.lugares
  add column cidade text check (char_length(cidade) between 1 and 100),
  add column uf text check (uf ~ '^[A-Z]{2}$');

update public.lugares set cidade = 'Porto Alegre', uf = 'RS' where cidade is null;

create index lugares_cidade_idx on public.lugares (uf, cidade);

-- Índice de texto da busca, agora com a cidade.
drop index if exists public.lugares_busca_idx;
create index lugares_busca_idx on public.lugares using gin (
  public.f_unaccent(lower(nome || ' ' || coalesce(endereco, '') || ' ' || coalesce(bairro, '') || ' ' || coalesce(cidade, '')))
  extensions.gin_trgm_ops
);

-- A busca passa a devolver a cidade e a procurar também por ela ("café Curitiba").
-- O tipo de retorno muda, então a função é recriada.
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
  select r.id, r.nome, r.categoria, r.endereco, r.bairro, r.cidade, r.uf, r.lat, r.lng, r.origem, r.osm_id,
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
