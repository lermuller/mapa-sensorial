-- Moderação: limites de relatos, e-mails descartáveis, ocultar relatos denunciados
-- e quem modera. As regras ficam no banco para valerem mesmo fora do site.

-- ---------------------------------------------------------------------------
-- 1. Limites de relatos (horário de Porto Alegre)
-- ---------------------------------------------------------------------------

-- Sem security definer: roda como quem insere. Vale para pessoas logadas (papel
-- "authenticated"); scripts do projeto com a chave secreta (ex.: dados de demonstração) passam.
create or replace function public.limitar_relatos()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  inicio timestamptz := hoje::timestamp at time zone 'America/Sao_Paulo';
begin
  if current_user <> 'authenticated' then
    return new;
  end if;

  if exists (
    select 1 from public.relatos
     where usuario_id = new.usuario_id
       and lugar_id = new.lugar_id
       and criado_em >= inicio
  ) then
    raise exception 'limite_lugar_dia'
      using hint = 'Uma pessoa pode contar como é um lugar uma vez por dia.';
  end if;

  if (
    select count(*) from public.relatos
     where usuario_id = new.usuario_id
       and criado_em >= inicio
  ) >= 30 then
    raise exception 'limite_relatos_dia'
      using hint = 'Limite de 30 relatos por dia.';
  end if;

  return new;
end;
$$;

create trigger ao_criar_relato_limites
  before insert on public.relatos
  for each row execute function public.limitar_relatos();

create index if not exists relatos_usuario_criado_idx on public.relatos (usuario_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- 2. E-mails descartáveis: bloqueados no cadastro (vale também para chamadas diretas à API)
-- ---------------------------------------------------------------------------

create table public.dominios_bloqueados (
  dominio text primary key check (dominio = lower(dominio))
);
alter table public.dominios_bloqueados enable row level security;
-- Sem políticas: só o banco (gatilho) e o painel leem.

insert into public.dominios_bloqueados (dominio) values
  ('mailinator.com'), ('guerrillamail.com'), ('guerrillamail.net'), ('sharklasers.com'),
  ('10minutemail.com'), ('10minutemail.net'), ('tempmail.com'), ('temp-mail.org'),
  ('tempmail.net'), ('yopmail.com'), ('yopmail.net'), ('trashmail.com'), ('getnada.com'),
  ('dispostable.com'), ('maildrop.cc'), ('throwawaymail.com'), ('fakeinbox.com'),
  ('mintemail.com'), ('mohmal.com'), ('emailondeck.com'), ('burnermail.io'),
  ('mailnesia.com'), ('spamgourmet.com'), ('tempr.email'), ('discard.email'),
  ('mailcatch.com'), ('moakt.com'), ('tmail.ws'), ('emailfake.com'), ('tempail.com'),
  ('linshiyouxiang.net'), ('mailpoof.com'), ('inboxkitten.com'), ('1secmail.com'),
  ('1secmail.org'), ('1secmail.net'), ('mail.tm'), ('mail.gw'), ('cuvox.de'),
  ('armyspy.com'), ('dayrep.com'), ('einrot.com'), ('fleckens.hu'), ('gustr.com'),
  ('jourrapide.com'), ('rhyta.com'), ('superrito.com'), ('teleworm.us')
on conflict do nothing;

create or replace function public.bloquear_email_descartavel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.dominios_bloqueados
     where dominio = lower(split_part(new.email, '@', 2))
  ) then
    raise exception 'email_descartavel'
      using hint = 'Use um e-mail pessoal: não aceitamos e-mails temporários.';
  end if;
  return new;
end;
$$;

create trigger antes_de_criar_usuario
  before insert on auth.users
  for each row execute function public.bloquear_email_descartavel();

-- ---------------------------------------------------------------------------
-- 3. Ocultar relato denunciado por 2 pessoas diferentes, até a moderação revisar
-- ---------------------------------------------------------------------------

alter table public.relatos add column oculto boolean not null default false;

create or replace function public.ocultar_relato_denunciado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(distinct denunciante_id) from public.denuncias
     where relato_id = new.relato_id and not resolvida
  ) >= 2 then
    update public.relatos set oculto = true where id = new.relato_id;
  end if;
  return new;
end;
$$;

create trigger ao_denunciar
  after insert on public.denuncias
  for each row execute function public.ocultar_relato_denunciado();

-- Quem escreveu continua vendo o próprio relato (aparece como "em revisão").
drop policy "relatos são públicos" on public.relatos;
create policy "relatos visíveis são públicos"
  on public.relatos for select to anon, authenticated
  using (not oculto or usuario_id = (select auth.uid()));

-- A pessoa não pode tirar o próprio relato da revisão editando.
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
  if current_user = 'authenticated' then
    new.oculto := old.oculto;
  end if;
  return new;
end;
$$;

-- Contagem da busca sem os relatos ocultos.
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
    select l.*,
      (select count(*) from public.relatos r where r.lugar_id = l.id and not r.oculto) as total_relatos
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

-- ---------------------------------------------------------------------------
-- 4. Moderadores: adicionados à mão (painel do Supabase ou SQL).
--    A tela /moderacao confere esta tabela no servidor e usa a chave secreta.
-- ---------------------------------------------------------------------------

create table public.moderadores (
  usuario_id uuid primary key references public.usuarios (id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.moderadores enable row level security;

create policy "pessoa vê se é moderadora"
  on public.moderadores for select to authenticated
  using (usuario_id = (select auth.uid()));
