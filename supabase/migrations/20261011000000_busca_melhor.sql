-- Busca melhor: subtipo do lugar (café, restaurante, museu…) e tolerância a erros de digitação.
--
-- O subtipo vem das tags do OpenStreetMap (scripts/importar-osm.ts) e permite buscar
-- "cafeterias" sem misturar com restaurantes. Lugares sem subtipo (adicionados pelas
-- pessoas) continuam aparecendo na categoria.

alter table public.lugares
  add column subtipo text check (subtipo ~ '^[a-z_]{2,40}$');

create index lugares_subtipo_idx on public.lugares (subtipo);

-- Nova assinatura (com subtipos e palavra): a antiga sai.
drop function if exists public.buscar_lugares(
  text, public.categoria_lugar[], double precision, double precision, double precision, double precision, int
);

create or replace function public.buscar_lugares(
  termo text default null,
  categorias public.categoria_lugar[] default null,
  sul double precision default null,
  oeste double precision default null,
  norte double precision default null,
  leste double precision default null,
  limite int default 100,
  -- Busca por tipo ("cafés"): subtipos aceitos e a palavra usada, que também vale no nome
  -- (um "Café do Porto" marcado como restaurante no OSM continua aparecendo).
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
      public.f_unaccent(lower(l.nome || ' ' || coalesce(l.endereco, '') || ' ' || coalesce(l.bairro, ''))) as texto,
      (select count(*) from public.relatos r where r.lugar_id = l.id and not r.oculto) as total_relatos
    from public.lugares l
    where
      (categorias is null or cardinality(categorias) = 0 or l.categoria = any (categorias))
      and (sul is null or l.lat between sul and norte)
      and (oeste is null or l.lng between oeste and leste)
  ),
  filtrados as (
    select c.*,
      -- Parecido com o termo, para tolerar erros de digitação ("brisa forneria").
      case when t.q = '' then 1 else extensions.word_similarity(t.q, c.texto) end as parecido
    from candidatos c, t
    where
      (
        subtipos is null or cardinality(subtipos) = 0
        or c.subtipo = any (subtipos)
        or (c.subtipo is null and c.origem = 'usuario')
        or (t.p <> '' and public.f_unaccent(lower(c.nome)) like '%' || t.p || '%')
      )
      and (
        t.q = ''
        or c.texto like '%' || t.q || '%'
        or (char_length(t.q) >= 4 and extensions.word_similarity(t.q, c.texto) >= 0.55)
      )
  )
  select f.id, f.nome, f.categoria, f.endereco, f.bairro, f.lat, f.lng, f.origem, f.total_relatos
  from filtrados f, t
  order by
    -- Quem bate exatamente vem antes de quem só é parecido.
    case when t.q = '' or f.texto like '%' || t.q || '%' then 0 else 1 end,
    f.total_relatos > 0 desc,
    case when t.q <> '' and public.f_unaccent(lower(f.nome)) like t.q || '%' then 0 else 1 end,
    f.parecido desc,
    f.total_relatos desc,
    f.nome
  limit least(greatest(limite, 1), 200);
$$;

grant execute on function public.buscar_lugares to anon, authenticated;
