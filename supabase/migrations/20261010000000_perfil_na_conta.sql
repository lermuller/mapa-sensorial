-- Perfil sensorial na conta (opcional, com consentimento específico).
-- Sensibilidade sensorial pode revelar condição de saúde: dado sensível pela LGPD (art. 11).
-- Só é guardado com consentimento destacado, e some ao apagar o perfil ou a conta.

alter table public.usuarios
  add column perfil_sensorial text[] not null default '{}',
  add column perfil_consentido_em timestamptz,
  add constraint perfil_sensorial_valido check (
    perfil_sensorial <@ array['som', 'luz', 'cheiro', 'lotacao', 'visual', 'temperatura']::text[]
  ),
  add constraint perfil_com_consentimento check (
    cardinality(perfil_sensorial) = 0 or perfil_consentido_em is not null
  );

-- O cadastro passa o perfil em options.data. O gatilho copia para public.usuarios
-- (só com consentimento) e tira o perfil dos metadados de auth.users, para o dado
-- sensível não ficar guardado em dois lugares.
create or replace function public.criar_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  perfil text[] := '{}';
  consentiu boolean := coalesce((new.raw_user_meta_data ->> 'perfil_consentido')::boolean, false);
begin
  if consentiu and jsonb_typeof(new.raw_user_meta_data -> 'perfil_sensorial') = 'array' then
    select coalesce(array_agg(distinct v), '{}')
      into perfil
      from jsonb_array_elements_text(new.raw_user_meta_data -> 'perfil_sensorial') as v
      where v in ('som', 'luz', 'cheiro', 'lotacao', 'visual', 'temperatura');
  end if;

  insert into public.usuarios (id, nome, nome_publico, perfil_sensorial, perfil_consentido_em)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome_publico'), ''), split_part(new.email, '@', 1)),
    perfil,
    case when cardinality(perfil) > 0 then now() end
  );

  update auth.users
     set raw_user_meta_data = raw_user_meta_data - 'perfil_sensorial' - 'perfil_consentido'
   where id = new.id;

  return new;
end;
$$;
