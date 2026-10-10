# Mapa Sensorial

Site colaborativo onde pessoas relatam os estímulos sensoriais dos lugares de Porto Alegre
(som, luz, cheiro, lotação, visual, temperatura) e quando eles acontecem. A especificação do
produto está em [SPEC.md](SPEC.md).

**Stack:** Next.js 16 (App Router, TypeScript, Tailwind 4) · Supabase (Postgres + login por link
mágico) · MapLibre GL com tiles do OpenFreeMap.

## Como rodar

1. Crie um projeto em [supabase.com](https://supabase.com) (o plano gratuito basta).
2. Copie `.env.example` para `.env.local` e preencha com as chaves do projeto
   (Painel › Project Settings › API Keys).
3. Aplique o esquema do banco:
   ```bash
   supabase link --project-ref SEU-PROJETO
   ```
   ```bash
   supabase db push
   ```
4. No painel do Supabase, em Authentication › URL Configuration, defina a **Site URL**
   (`http://localhost:3000` em desenvolvimento) e adicione `http://localhost:3000/auth/callback`
   às **Redirect URLs**.
5. Importe a base de lugares do OpenStreetMap:
   ```bash
   npm run importar-osm
   ```
   Use `-- --simular` para só ver o que seria importado. Se o Overpass estiver sobrecarregado,
   tente mais tarde ou defina outro servidor em `OVERPASS_URL`.
6. Instale e rode:
   ```bash
   npm install
   ```
   ```bash
   npm run dev
   ```

## Scripts

| Comando                | O que faz                                      |
|------------------------|------------------------------------------------|
| `npm run dev`          | Servidor de desenvolvimento em localhost:3000  |
| `npm test`             | Testes das regras de cálculo (Vitest)          |
| `npm run typecheck`    | Checagem de tipos                              |
| `npm run lint`         | ESLint                                         |
| `npm run importar-osm` | Importa/atualiza lugares do OpenStreetMap      |

## Onde está cada coisa

- `supabase/migrations/`: esquema do banco, regras de acesso (RLS) e função de busca.
- `src/lib/calculo.ts`: badges, melhor horário e ordenação por sensibilidade (regras da SPEC),
  com testes em `calculo.test.ts`.
- `src/lib/estimulos.ts`: lista fixa de estímulos, intensidades e categorias.
- `src/lib/perfil.ts`: perfil sensorial, guardado só no `localStorage`.
- `src/lib/dados.ts`: consultas ao banco. `src/lib/acoes/`: Server Actions (relatos, lugares, conta).
- `src/app/`: páginas (busca, lugar, relatar, conta…).
- `scripts/importar-osm.ts`: importação inicial do OpenStreetMap.

## Decisões de implementação

- **Sem animações**: o CSS global desliga `animation` e `transition`; o mapa não tem rotação,
  inclinação nem esmaecimento; a rolagem só dá zoom com Ctrl/⌘ e não prende a página.
- **Sem pop-ups**: confirmações (apagar relato, apagar conta) são páginas ou campos, não diálogos.
  No mapa, o lugar escolhido aparece abaixo dele, não num balão.
- **Renderização dinâmica comum** (`cacheComponents: false`): a página aparece pronta de uma vez,
  sem placeholders que mudam o layout.
- **Recência**: para relatos com data, vale a data informada; para "é sempre assim", a data de
  criação do relato.
- **Melhor horário**: só aparece para faixas com pelo menos 2 relatos e ao menos 1 com horário
  naquela faixa, para não "inventar" um horário só com relatos "é sempre assim". Relatos da
  madrugada (0h–6h) entram nos badges, mas não nas faixas.
- **Denúncias**: exigem login e ficam na tabela `denuncias`, visível só pelo painel do Supabase
  (moderação manual).
- **Apagar conta** usa a `SUPABASE_SECRET_KEY` no servidor; os relatos são apagados em cascata.
