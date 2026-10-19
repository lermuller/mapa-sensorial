# Mapa Sensorial — especificação do MVP

> Nome provisório. Documento vivo: atualize conforme as decisões forem tomadas.

## Visão

Pessoas autistas precisam de previsibilidade ao ir a um lugar e costumam ser sensíveis a estímulos visuais, sonoros, olfativos e outros. O Mapa Sensorial é um site colaborativo onde as pessoas relatam os estímulos sensoriais de cada lugar (e quando eles acontecem), para que outras possam se preparar ou escolher o melhor horário para ir.

**Abrangência:** Brasil. Porto Alegre (RS) tem a base inicial importada do OpenStreetMap; nas outras cidades, os lugares entram sob demanda: a busca completa os resultados com o OpenStreetMap (Photon) e o lugar é gravado na base ao ser aberto (dados confirmados no Nominatim). "Adicionar lugar" aceita qualquer ponto do Brasil; cidade e estado vêm do ponto marcado. O mapa começa em Porto Alegre e tem o botão "Perto de mim" (localização só no navegador).

**Plataforma:** web, funcionando bem no celular. Não é um app de loja.

## Princípios

1. **Feito com a comunidade autista.** As decisões de produto são validadas com pessoas autistas.
2. **O próprio site é sensorialmente amigável.** Nada de animações, pop-ups, sons ou autoplay. Cores calmas, linguagem clara e direta, layout previsível.
3. **O relato descreve o lugar, não a pessoa.** Nenhum dado de saúde é obrigatório. O perfil sensorial é opcional e só é guardado na conta com consentimento específico (ver seção 3).
4. **Poucos dados bons valem mais que muitos ruins.** Os badges só aparecem quando há relatos suficientes, e os relatos recentes pesam mais.

## Estímulos e intensidade

Lista fixa de estímulos usada nos relatos, nos badges e nos filtros:

| Estímulo    | O que cobre                                        |
|-------------|----------------------------------------------------|
| Som         | Volume, música ambiente, ruídos súbitos, eco        |
| Luz         | Luz forte, fluorescente, piscante, telas            |
| Cheiro      | Perfumes, comida, produtos de limpeza               |
| Lotação     | Quantidade de pessoas, filas, contato físico        |
| Visual      | Poluição visual, propagandas, movimento             |
| Temperatura | Muito frio (ar-condicionado) ou muito quente        |

**Intensidade:** `baixo` · `médio` · `alto`

## Funcionalidades do MVP

### 1. Busca

- Busca por **nome do lugar**, **endereço/bairro** ou **tipo de lugar** ("cafés", "museus", "posto de saúde"; ver `src/lib/busca.ts`). A palavra de tipo vira filtro pelo subtipo do OpenStreetMap e o resto continua como texto ("café no Bom Fim"). Tolera erros de digitação ("brisa forneria"). Sem resultado por tipo, busca o texto inteiro. Se o texto for um bairro ou cidade ("Moinhos de Vento", "café no Bom Fim", "Batel Curitiba"), mostra os lugares dentro da área dele (Photon), porque muitos lugares do OSM não têm o bairro preenchido. Sugestões enquanto digita (rota /sugestoes): tipo de lugar, lugares da base e bairros/cidades. Carregamentos têm aviso estático ("Abrindo…", "Buscando…", ampulheta no lugar da seta), sem animação.
- Resultado em **mapa + lista**, alternáveis. No celular, a lista é a visão padrão.

### 2. Filtros

Agrupados por tipo:

- **Tipo de lugar:** shopping, supermercado, restaurante/café, parque/praça, saúde (clínica, hospital, laboratório), cultura (museu, cinema, teatro), transporte (rodoviária, aeroporto, estação), serviço público, outros.
- **Sensibilidade:** um ou mais estímulos da tabela acima. O filtro mostra primeiro os lugares com intensidade baixa nos estímulos escolhidos.
- **Quando vou:** dia da semana e faixa de horário (opcional). Usa os relatos daquele horário quando houver.

### 3. Perfil sensorial ("Meus tipos de sensibilidade")

- A pessoa marca os estímulos aos quais é sensível, no cadastro (opcional) ou depois, na página do perfil.
- **Guardado na conta**, só com **consentimento específico e destacado** (caixa própria, separada do aceite dos termos). Sensibilidade sensorial pode revelar condição de saúde: é tratado como **dado sensível** (LGPD, art. 11).
- Nos filtros, quem está logado tem a opção **"Usar meu perfil sensorial"** (ligada por padrão). Com ela, a busca mostra primeiro os lugares **mais confortáveis** para os estímulos do perfil, e o **melhor horário** de cada lugar é calculado para eles. Não há destaque visual: o perfil muda a ordem da busca.
- Os estímulos do perfil **nunca vão na URL** (só `perfil=1`) e nunca aparecem para outras pessoas.
- A pessoa pode **apagar o perfil** a qualquer momento; ele também some ao apagar a conta.
- Sem conta, dá para usar os filtros de sensibilidade manualmente.

### 4. Página do lugar

- Nome, categoria, endereço, mini-mapa.
- **Badges** (ver regras abaixo), no estilo das comodidades do Airbnb: ícone + texto curto, por exemplo "Som alto", "Luz forte", "Pouca lotação de manhã".
- **Melhor horário** para ir, quando houver relatos com horário suficientes.
- **O que esperar:** os textos de previsibilidade mais recentes.
- **Aba "Relatos":** lista dos relatos individuais, do mais recente para o mais antigo.
- Botão **"Relatar este lugar"**.

### 5. Relato

Campos:

| Campo               | Tipo                                   | Obrigatório |
|---------------------|----------------------------------------|-------------|
| Estímulos           | Para cada estímulo: baixo/médio/alto ou "não reparei" | Pelo menos 1 |
| Quando              | "É sempre assim" **ou** data + horário aproximado | Sim |
| O que esperar       | Texto livre (ex.: "tem revista na entrada", "a praça de alimentação fica lotada no almoço") | Não |
| Comentário          | Texto livre                            | Não         |

- Exige login.
- A pessoa pode editar ou apagar os próprios relatos.
- Botão para **denunciar** relato. Com denúncias de **2 pessoas diferentes**, o relato sai do ar até a moderação revisar (tela /moderacao, para quem está na tabela `moderadores`).
- **Limites:** um relato por pessoa, por lugar, por dia; até **30 relatos por conta por dia**; e-mails descartáveis não podem criar conta.
- **Textos livres** passam por um filtro: sem e-mail, telefone, CPF, links, perfis de redes sociais ou palavras ofensivas.

### 6. Conta

- Cadastro só com **nome, nome público e e-mail** (perfil sensorial opcional). Login por **código enviado por e-mail**, sem senha: funciona em qualquer navegador ou aparelho.
- O **nome público** é o que aparece nos relatos. Pode ser um apelido ou só o primeiro nome.
- A pessoa pode apagar a conta e os relatos dela.
- Só é necessária para relatar. Buscar e ver lugares não exige conta.

### 7. Lugares

- **Base inicial importada do OpenStreetMap** para Porto Alegre, nas categorias acima, para que a busca nunca venha vazia, mesmo sem relatos.
- A pessoa logada pode **adicionar um lugar** que não exista.
- Lugares sem relatos aparecem com o aviso "Ainda sem relatos — seja a primeira pessoa a relatar".

## Regras de cálculo

### Badges

Para cada lugar × estímulo:

1. Considera os relatos dos **últimos 12 meses** que avaliaram aquele estímulo.
2. Converte: baixo = 0, médio = 1, alto = 2.
3. Média ponderada por recência: o peso de um relato cai pela metade a cada 6 meses.
4. Resultado: < 0,67 → **baixo**, 0,67–1,33 → **médio**, > 1,33 → **alto**.
5. O badge aparece **a partir de 1 relato**, para quem relata ver o resultado na hora. Com 1 relato mostra o aviso "1 relato"; com 2–4, "poucos relatos". A proteção contra relatos isolados fica com a moderação. Melhor horário, grade da semana e filtro "Quando vou" continuam exigindo 2 relatos na faixa.

Os relatos "é sempre assim" entram em todos os horários. Os relatos com horário entram no cálculo geral e no de melhor horário.

### Melhor horário

- Faixas: **dia útil / fim de semana** × **manhã (6–12h) / tarde (12–18h) / noite (18–24h)**.
- Calcula a intensidade média de cada faixa considerando os estímulos (os do perfil da pessoa, se houver; senão, todos).
- Mostra a faixa mais tranquila quando ela tiver **pelo menos 2 relatos**.

> Os limites (2 relatos, 12 meses, 6 meses) são pontos de partida. Revisar quando houver dados reais.

## Modelo de dados (rascunho)

- **Lugar:** id, nome, categoria, endereço, lat/lng, origem (osm/usuário), osm_id, criado_em
- **Relato:** id, lugar_id, usuário_id, intensidades {som, luz, cheiro, lotação, visual, temperatura}, sempre_assim (bool), data, hora, o_que_esperar, comentário, criado_em, editado_em
- **Usuário:** id, nome, nome_público, e-mail, perfil_sensorial (lista de estímulos, opcional), perfil_consentido_em, criado_em
- **Denúncia:** id, relato_id, motivo, criado_em, resolvida

O perfil sensorial fica em `usuarios.perfil_sensorial`, só com `perfil_consentido_em` preenchido (regra no banco).

### Avaliar vários lugares de uma vez (/avaliar)

- Para quem tem conta: uma linha por lugar (busca com sugestões, inclusive Brasil todo), os níveis dos 6 estímulos e quando foi (é sempre assim, ou manhã/tarde/noite + dia). Cada linha vira um relato sem texto da própria conta e conta igual aos outros relatos.
- Planilha: modelo CSV em /avaliar/modelo (`;`, abre no Excel); ao subir, as linhas aparecem com o lugar encontrado automaticamente para a pessoa conferir antes de salvar.
- Limites: um relato por lugar por dia e até 100 por conta por dia (antes 30). Até 100 linhas por envio.
- Entradas: aba "Meus relatos" da conta e "Como contribuir" em /sobre.

### Problemas em lugares

- Botão "Informar um problema" no lugar (com conta): não existe ou fechou, local errado, nome ou tipo errado, repetido, ofensivo ou propaganda, outro. Cada pessoa informa cada motivo uma vez por lugar.
- Regras automáticas: **ofensivo** com 2 pessoas diferentes → o lugar sai do ar até a revisão; **não existe ou fechou** com 3 pessoas → aviso "Pode ter fechado" (o lugar continua visível). O resto vai para a fila de /moderacao (seção Lugares: manter, corrigir, arquivar). Arquivar esconde sem apagar.
- Ao adicionar: aviso "Já está no mapa?" com os lugares a até ~150 m; mesmo nome a menos de ~150 m é barrado; filtro de ofensas no nome; até 5 lugares por conta por dia.
- Quem adicionou pode corrigir ou apagar o lugar enquanto ele não tiver relatos de outras pessoas; a moderação pode sempre.

### Métricas e dados abertos

- **/metricas** (só moderação, tabela `moderadores`): relatos (total, 7 e 30 dias, por semana, com “O que esperar”), contas (novas, que entraram e que contribuíram nos últimos 30 dias, % que já relatou), lugares avaliados, adicionados pela comunidade e denúncias abertas. Só contagens; o perfil sensorial não entra.
- **/dados** (público) e **/dados/csv**: por tipo de lugar (cafés, restaurantes e lanchonetes separados pelo subtipo), a parte das avaliações “alto” de cada estímulo e a variação por dia e horário. Só níveis, tipo, data e horário dos relatos no ar; sem nomes, contas, textos ou perfis. Tipos de lugar com menos de 5 relatos aparecem com o aviso "amostra pequena" (coluna amostra_pequena no CSV); na tabela por horário, menos de 5 avaliações não aparecem. Seletor de tipo de lugar com os estímulos ordenados do mais relatado como alto. Licença CC BY 4.0.
- Visitas e páginas vistas ainda não são medidas (exigiria um serviço de analytics e atualizar a política de privacidade).

## Fora do MVP (próximas versões)

- Zonas dentro do lugar (praça de alimentação, banheiro, estacionamento…)
- Fotos
- Selos oficiais "Amigo do Autista" exibidos no lugar
- Outras cidades
- Detalhes específicos: secador de mão, luz piscante, espaço calmo, saídas
- Votar se um relato foi útil

## Decisões em aberto

- [ ] Nome definitivo
- [x] Stack técnica: Next.js 16 (App Router, TypeScript) + Supabase (Postgres, login por link mágico). Hospedagem proposta: Vercel + Supabase
- [x] Biblioteca de mapa: MapLibre GL com tiles do OpenFreeMap (dados do OpenStreetMap)
- [x] Texto da política de privacidade e dos termos de uso: rascunho em `/privacidade` e `/termos` (dados em `src/lib/legal.ts`), conta só para 18+
- [ ] Quem modera as denúncias e com que critérios
- [ ] Quais comunidades e associações de Porto Alegre envolver no teste inicial

## Antes de lançar

- [ ] Domínio próprio verificado no Resend (SPF/DKIM) e remetente do Supabase trocado para ele
- [ ] Aumentar o limite de e-mails em *Authentication › Rate Limits* (padrão ~30/hora)
- [ ] Publicar o site (Vercel) e adicionar `https://DOMINIO/auth/callback` nas Redirect URLs do Supabase; trocar a Site URL e `NEXT_PUBLIC_SITE_URL`
- [x] Apagar os relatos de demonstração: `npm run dados-demo -- --remover` (feito em 11/10/2026)
- [ ] Revisão jurídica da política de privacidade e dos termos; confirmar o nome legal do responsável em `src/lib/legal.ts` e definir `NEXT_PUBLIC_EMAIL_CONTATO` (canal de privacidade)
- [ ] Definir quem modera e adicionar na tabela `moderadores`
- [ ] Revisar com a comunidade a lista de palavras do filtro (`src/lib/moderacao.ts`)
