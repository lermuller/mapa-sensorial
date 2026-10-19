-- Avaliação de vários lugares de uma vez (/avaliar): o limite diário por conta sobe de 30
-- para 100 relatos. Continua valendo um relato por lugar por dia.

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
  ) >= 100 then
    raise exception 'limite_relatos_dia'
      using hint = 'Limite de 100 relatos por dia.';
  end if;

  return new;
end;
$$;
