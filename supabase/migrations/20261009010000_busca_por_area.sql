-- Busca por área do mapa (página inicial em mapa, estilo Airbnb).
-- Substitui buscar_lugares: mesma busca, com um retângulo opcional (sul, oeste, norte, leste).

drop function if exists public.buscar_lugares(text, public.categoria_lugar[], int);

create index if not exists lugares_posicao_idx on public.lugares (lat, lng);

create or replace function public.buscar_lugares(
  termo text default null,
  categorias public.categoria_lugar[] default null,
  sul double precision default null,
  oeste double precision default null,
  norte double precision default null,
  leste double precision default null,
  limite int default 100
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
  ),
  candidatos as (
    select l.*, (select count(*) from public.relatos r where r.lugar_id = l.id) as total_relatos
    from public.lugares l, t
    where
      (t.q = '' or public.f_unaccent(lower(l.nome || ' ' || coalesce(l.endereco, '') || ' ' || coalesce(l.bairro, ''))) like '%' || t.q || '%')
      and (categorias is null or cardinality(categorias) = 0 or l.categoria = any (categorias))
      and (sul is null or l.lat between sul and norte)
      and (oeste is null or l.lng between oeste and leste)
  )
  select c.id, c.nome, c.categoria, c.endereco, c.bairro, c.lat, c.lng, c.origem, c.total_relatos
  from candidatos c, t
  order by
    c.total_relatos > 0 desc,
    case when t.q <> '' and public.f_unaccent(lower(c.nome)) like t.q || '%' then 0 else 1 end,
    c.total_relatos desc,
    c.nome
  limit least(greatest(limite, 1), 200);
$$;

grant execute on function public.buscar_lugares to anon, authenticated;
