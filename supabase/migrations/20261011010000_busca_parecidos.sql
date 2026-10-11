-- Tolerância a erros só quando nada bate exatamente: buscar "mark" deve trazer as
-- Mark Hamburgueria, e não também "Mariland" ou "Marquês" por semelhança.

create or replace function public.buscar_lugares(
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
    select
      public.f_unaccent(lower(trim(coalesce(termo, '')))) as q,
      public.f_unaccent(lower(trim(coalesce(palavra, '')))) as p
  ),
  candidatos as (
    select l.*,
      public.f_unaccent(lower(l.nome || ' ' || coalesce(l.endereco, '') || ' ' || coalesce(l.bairro, ''))) as texto
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
  -- Parecidos ("brisa forneria" → Brizza Forneria) só entram quando não há nenhum exato.
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
  select r.id, r.nome, r.categoria, r.endereco, r.bairro, r.lat, r.lng, r.origem,
    (select count(*) from public.relatos x where x.lugar_id = r.id and not x.oculto) as total_relatos
  from resultado r, t
  order by
    -- Nome começando pelo termo vem primeiro; depois quem tem relatos.
    case when t.q <> '' and public.f_unaccent(lower(r.nome)) like t.q || '%' then 0 else 1 end,
    (select count(*) from public.relatos x where x.lugar_id = r.id and not x.oculto) > 0 desc,
    r.parecido desc,
    r.nome
  limit least(greatest(limite, 1), 200);
$$;

grant execute on function public.buscar_lugares to anon, authenticated;
