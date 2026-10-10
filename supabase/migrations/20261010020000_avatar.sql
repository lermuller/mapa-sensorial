-- Avatar da pessoa: uma variação dos rostos padrão da identidade visual.
-- Formato "forma:rosto:cor" (ex.: "bolha:feliz:verde"). Aparece junto do nome público.

alter table public.usuarios
  add column avatar text not null default 'bolha:feliz:verde'
  constraint avatar_valido check (
    avatar ~ '^(bolha|bloco|triangulo|octogono):(feliz|calmo|curioso|piscando):(verde|lilas|amarelo|rosa|laranja|azul)$'
  );

-- A visão pública passa a mostrar também o avatar.
create or replace view public.nomes_publicos
with (security_invoker = false) as
  select id, nome_publico, avatar from public.usuarios;
