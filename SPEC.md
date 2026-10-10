# Mapa Sensorial — especificação do MVP

> Nome provisório. Documento vivo: atualize conforme as decisões forem tomadas.

## Visão

Pessoas autistas precisam de previsibilidade ao ir a um lugar e costumam ser sensíveis a estímulos visuais, sonoros, olfativos e outros. O Mapa Sensorial é um site colaborativo onde as pessoas relatam os estímulos sensoriais de cada lugar (e quando eles acontecem), para que outras possam se preparar ou escolher o melhor horário para ir.

**Primeira cidade:** Porto Alegre (RS).

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

- Busca por **nome do lugar** ou **endereço/bairro**.
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
5. O badge só aparece com **pelo menos 2 relatos**. Com 2–4 relatos, mostra o aviso "poucos relatos".

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
- [ ] Apagar os relatos de demonstração: `npm run dados-demo -- --remover`
- [ ] Revisão jurídica da política de privacidade e dos termos; confirmar o nome legal do responsável em `src/lib/legal.ts` e definir `NEXT_PUBLIC_EMAIL_CONTATO` (canal de privacidade)
- [ ] Definir quem modera e adicionar na tabela `moderadores`
- [ ] Revisar com a comunidade a lista de palavras do filtro (`src/lib/moderacao.ts`)
