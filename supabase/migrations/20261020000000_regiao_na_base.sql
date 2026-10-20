-- Cidade ou bairro a partir dos lugares da própria base ("Recife", "shopping recife",
-- "Boa Viagem Recife"). Antes a busca dependia só do Photon, que às vezes demora e faz a busca
-- cair para texto. Devolve o retângulo onde estão os lugares daquela cidade ou bairro.

create or replace function public.regiao_na_base(texto text)
returns table (
  nome text,
  cidade text,
  uf text,
  tipo text,
  sul double precision,
  oeste double precision,
  norte double precision,
  leste double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  with t as (
    select regexp_replace(public.f_unaccent(lower(trim(coalesce(texto, '')))), '^bairro\s+', '') as q
  ),
  cidades as (
    select l.cidade as nome, l.cidade, l.uf, 'cidade'::text as tipo,
      min(l.lat) as sul, min(l.lng) as oeste, max(l.lat) as norte, max(l.lng) as leste,
      count(*) as n
    from public.lugares l, t
    where l.cidade is not null
      and length(t.q) >= 3
      and (
        public.f_unaccent(lower(l.cidade)) = t.q
        or public.f_unaccent(lower(l.cidade || ' ' || coalesce(l.uf, ''))) = t.q
      )
    group by l.cidade, l.uf
  ),
  -- Bairros: sem as pontas (endereços do OSM às vezes têm o bairro errado).
  bairros as (
    select l.bairro as nome, l.cidade, l.uf, 'bairro'::text as tipo,
      percentile_cont(0.03) within group (order by l.lat) as sul,
      percentile_cont(0.03) within group (order by l.lng) as oeste,
      percentile_cont(0.97) within group (order by l.lat) as norte,
      percentile_cont(0.97) within group (order by l.lng) as leste,
      count(*) as n
    from public.lugares l, t
    where l.bairro is not null
      and length(t.q) >= 3
      and (
        public.f_unaccent(lower(l.bairro)) = t.q
        or public.f_unaccent(lower(l.bairro || ' ' || coalesce(l.cidade, ''))) = t.q
        or public.f_unaccent(lower(l.bairro || ' ' || coalesce(l.cidade, '') || ' ' || coalesce(l.uf, ''))) = t.q
      )
    group by l.bairro, l.cidade, l.uf
    having count(*) >= 3
  )
  select r.nome, r.cidade, r.uf, r.tipo,
    r.sul - 0.002, r.oeste - 0.002, r.norte + 0.002, r.leste + 0.002
  from (select * from cidades union all select * from bairros) r
  order by r.n desc
  limit 1;
$$;

grant execute on function public.regiao_na_base(text) to anon, authenticated;
