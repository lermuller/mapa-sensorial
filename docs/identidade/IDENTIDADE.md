# Identidade visual — Mapa Sensorial

Especificação da marca para aplicar na UI. A página de referência completa está em
[referencia.html](referencia.html) (abra no navegador; tem o seletor de contraste) e publicada em
https://claude.ai/artifact/R8DyBggydwPpW4XSpTMnDi.

## Nome

- **Nome:** Mapa Sensorial
- **Subtítulo:** como é lá?
- Assinatura: símbolo + "Mapa Sensorial" (peso 800) com "como é lá?" embaixo, menor, em `--texto-suave`.

## Símbolo

- Arquivo: [simbolo.svg](simbolo.svg) (`fill="currentColor"`). É só a forma, **sem círculo em volta**.
- Cor: `--simbolo` (verde #5ED3A6 no modo suave, preto no alto contraste). Sempre sobre branco.
- Tamanho mínimo: 24 px de largura.
- Favicon e ícone da aba: o mesmo símbolo.

## Dois modos de contraste

A marca sempre funciona em dois modos. O site deve ter um seletor **Suave / Alto contraste** no
cabeçalho, que troca `data-contraste="suave|alto"` no `<html>`. O padrão segue
`prefers-contrast: more` e a escolha fica no `localStorage`. O texto passa no AA (4,5:1) nos dois modos.

| Token | Suave | Alto contraste |
|---|---|---|
| `--fundo` | #FFFFFF | #FFFFFF |
| `--superficie` | #F4F4F6 | #FFFFFF |
| `--texto` | #1A1D1C | #000000 |
| `--texto-suave` | #646B69 | #2B302E |
| `--borda` | #E6E6EA | #000000 |
| `--linha` (contorno de cartões, botões e chips) | 0px | 2.5px |
| `--contorno` (contorno dos personagens) | transparent | #000000 |
| `--rosto` (traço dos rostos) | #1A1D1C | #000000 |
| `--verde` (marca) | #5ED3A6 | #5ED3A6 |
| `--verde-suave` | #C9F0DE | #5ED3A6 |
| `--verde-texto` | #0F5C46 | #000000 |
| `--botao` / texto | #5ED3A6 / #1A1D1C | #000000 / #FFFFFF |
| `--botao-2` / texto (secundário escuro) | #1A1D1C / #FFFFFF | #FFFFFF / #000000 |
| `--simbolo` | #5ED3A6 | #000000 |
| `--foco` | #0F5C46 | #000000 |
| `--c-som` | #D9C2FF | #A46CFF |
| `--c-luz` | #FFE27A | #FFC800 |
| `--c-cheiro` | #FFC2E2 | #FF4FAE |
| `--c-lotacao` | #FFC59E | #FF7A1F |
| `--c-visual` | #C2CCFF | #5872FF |
| `--c-temperatura` | #FFAE9E | #FF5240 |
| `--c-geral` (rostos padrão) | #5ED3A6 | #5ED3A6 |

- Nunca usar texto branco sobre o verde #5ED3A6 (contraste baixo). Texto escuro sobre ele dá ~10:1.
- Texto preto passa no AA sobre todas as cores de estímulo, nos dois modos.
- **Modo escuro:** a marca foi desenhada sobre branco, mas o site mantém o modo escuro como
  adaptação (decisão do usuário). São quatro combinações: claro/escuro × suave/alto. Fundo escuro
  #121514 (suave) e #000000 (alto). Blocos e badges continuam nas cores dos estímulos com tinta
  escura. Peças de comunicação e materiais da marca continuam sempre sobre branco.
- **Onde fica a escolha:** o seletor Suave/Alto fica no botão do canto inferior direito, junto do
  tema. A escolha fica gravada num cookie (`src/lib/aparencia.ts`), para o servidor já renderizar o modo
  certo sem a página piscar.
- **Sprite:** o `personagens.svg` vai embutido no HTML (`<SpritePersonagens/>`). Como arquivo externo,
  ele não desenha no Chromium por causa das referências internas `<use href="#f-...">`.

## Tipografia

Atkinson Hyperlegible Next (já usada). Títulos grandes em peso 800 com letras próximas:

- Display: 800, `letter-spacing: -0.05em`, `line-height: 0.92`
- Títulos: 800, `letter-spacing: -0.035em`
- Destaques: 700 · Texto: 400 · Dados/rótulos: Atkinson Hyperlegible Mono

## Personagens

Sprite em [personagens.svg](personagens.svg). Cada símbolo se chama `p-<forma>-<rosto>` e é usado
com `<svg viewBox="-10 -10 120 120"><use href="#p-som-alto"/></svg>`. As cores vêm das variáveis CSS
acima (`--c-*`, `--c-geral`, `--contorno`, `--rosto`), então mudam sozinhas com o modo.

### Rostos de estímulo (quando o assunto é um estímulo)

| Estímulo | Forma (id) | Cor |
|---|---|---|
| Som | triângulo deitado, como o ícone de volume (`som`) | `--c-som` |
| Luz | sol (`luz`) | `--c-luz` |
| Cheiro | flor (`cheiro`) | `--c-cheiro` |
| Lotação | duas bolhas encostadas (`lotacao`) | `--c-lotacao` |
| Visual | olho (`visual`) | `--c-visual` |
| Temperatura | termômetro (`temperatura`) | `--c-temperatura` |

A cara indica a intensidade: `calmo` = baixo, `ok` = médio, `alto` = alto. **Sempre com o nível
escrito ao lado.** Esses personagens substituem as cores de intensidade antigas
(`--baixo-*`, `--medio-*`, `--alto-*`): o bloco ou badge usa a cor do estímulo e o rosto diz o nível.

### Rostos padrão (comunicação geral)

Formas `bolha`, `bloco`, `triangulo` e `octogono`, com os rostos `feliz`, `calmo`, `curioso` e
`piscando`. São verdes (`--c-geral`). Em peças sobre a comunidade, podem receber as cores dos
estímulos para representar diversidade (`style="--c-geral: var(--c-som)"`). As formas de estímulo
só aparecem quando o assunto é o estímulo.

### Regras

- Nunca se mexem (sem animação, o CSS global já desliga).
- Em blocos ou badges coloridos com a cor do estímulo, o personagem vai **branco**
  (sobrescreva `--c-*` para #FFFFFF dentro do bloco) para não sumir no fundo.
- No site, no máximo três personagens por tela; em telas de conteúdo, um só.
- Podem aparecer inclinados (até 15°) e cortados na borda, nunca sobre texto.

## Componentes

- **Botões:** pílula (`border-radius: 999px`). Principal: `--botao`. Secundário: `--botao-2` ou
  contorno de 2px em `--texto`. Seta em círculo dentro do botão principal é opcional.
- **Chips "Sou sensível a…":** pílula branca com o personagem do estímulo (rosto `calmo`) à esquerda;
  selecionado = fundo `--verde-suave`.
- **Página do lugar:** blocos em grade de 2 colunas ("bento"), cantos de 20px. Cada bloco: fundo na
  cor do estímulo, rótulo ("Som"), nível grande ("Baixo"), personagem branco cortado no canto inferior
  direito. "Melhor horário" ocupa a largura toda em `--c-verde`/`--verde-suave`.
- **Badges compactos:** "Som baixo", com o personagem branco do rosto do nível. O nível concorda em
  gênero com o estímulo ("Luz baixa", "Lotação alta"). Estímulo sem dados vira um bloco cinza
  "Ainda não sabemos".
- Cartões: `border-radius` 24–28px, fundo `--superficie`, contorno `var(--linha) solid var(--borda)`.

## Textos

- Botão de relatar: **"Contar como é lá"** (em vez de "Relatar este lugar").
- Sem relatos: "Ninguém contou como é aqui ainda. Você já foi?"
- Relato enviado: "Pronto, seu relato já aparece no lugar."
- Erro de campo: "Falta dizer quando você foi."
- Tom de comunidade: direto, próximo ("a gente", "você"), fala do lugar e nunca da condição de
  quem relata. "Pessoas autistas", não "portadores".
