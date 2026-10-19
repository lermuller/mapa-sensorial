import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { BotaoCompartilhar } from "@/components/BotaoCompartilhar";
import { LinkSeta, VoltarAoMapa } from "@/components/LinkSeta";
import { Personagem, ROSTO_DO_NIVEL, type FormaPadrao, type Rosto } from "@/components/Personagem";
import { env } from "@/lib/env";
import { COR_ESTIMULO, ESTIMULOS, INFO_ESTIMULO, NIVEIS, ROTULO_NIVEL } from "@/lib/estimulos";

export const metadata: Metadata = { title: "Sobre o projeto" };

const SECOES = [
  { id: "motivacao", rotulo: "Motivação" },
  { id: "como-funciona", rotulo: "Como funciona" },
  { id: "dados-abertos", rotulo: "Dados abertos" },
  { id: "como-contribuir", rotulo: "Como contribuir" },
  { id: "quem-faz", rotulo: "Quem faz" },
] as const;

const PASSOS: { titulo: string; texto: string; forma: FormaPadrao; rosto: Rosto }[] = [
  {
    titulo: "Busque um lugar",
    texto: "Pelo nome, pela cidade ou pelo tipo, como “café Curitiba”, ou explorando o mapa. Vale qualquer lugar do Brasil.",
    forma: "bolha",
    rosto: "curioso",
  },
  {
    titulo: "Veja o que esperar",
    texto: "Como costumam ser os estímulos do lugar e o horário mais tranquilo para ir.",
    forma: "bloco",
    rosto: "calmo",
  },
  {
    titulo: "Conte como foi",
    texto: "Seu relato ajuda a próxima pessoa a se preparar.",
    forma: "octogono",
    rosto: "feliz",
  },
];

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`titulo-${id}`} className="scroll-mt-24 space-y-4">
      <h2 id={`titulo-${id}`} className="text-2xl">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export default function PaginaSobre() {
  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <header className="space-y-4">
        <VoltarAoMapa />
        <div className="space-y-2">
          <h1 className="display text-4xl">
            Sobre o Mapa Sensorial, <span className="text-verde-titulo">como é lá?</span>
          </h1>
          <p className="text-texto-suave">Saiba o que esperar de um lugar antes de ir.</p>
        </div>
        <nav aria-label="Nesta página" className="flex flex-wrap gap-1.5">
          {SECOES.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="chip font-medium">
              {s.rotulo}
            </a>
          ))}
        </nav>
      </header>

      <Secao id="motivacao" titulo="Motivação">
        <p>
          Muitas pessoas autistas, com TDAH ou com outras diferenças sensoriais sentem barulho,
          luz, cheiros e multidões com mais intensidade. Um lugar que para alguém é só
          movimentado pode ser esgotante para outra pessoa.
        </p>
        <p>
          Saber antes como é um lugar ajuda a se preparar: dá para escolher o horário mais calmo,
          levar um fone, combinar uma pausa ou decidir ir outro dia. Previsibilidade sensorial é autonomia.
          O Mapa Sensorial junta o que quem já foi conta, para que ninguém precise descobrir na
          hora.
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {[
            ["Feito com a comunidade", "As decisões são testadas com pessoas autistas."],
            ["Fala do lugar", "Os relatos descrevem o lugar, nunca as pessoas."],
            ["Sem expor ninguém", "Nenhum dado de saúde é obrigatório. O perfil é privado."],
          ].map(([titulo, texto]) => (
            <li key={titulo} className="cartao bg-fundo p-4 text-sm">
              <strong className="block text-base">{titulo}</strong>
              <span className="text-texto-suave">{texto}</span>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao id="como-funciona" titulo="Como funciona">
        <ol className="grid gap-2 sm:grid-cols-3">
          {PASSOS.map((p, i) => (
            <li key={p.titulo} className="cartao space-y-2 bg-fundo p-4 text-sm">
              <span className="flex items-end gap-2">
                <Personagem forma={p.forma} rosto={p.rosto} className="h-20 w-20" />
                <span aria-hidden="true" className="display pb-1 text-5xl text-verde-titulo">
                  {i + 1}
                </span>
              </span>
              <strong className="block text-base">
                <span className="sr-only">Passo {i + 1}: </span>
                {p.titulo}
              </strong>
              <span className="text-texto-suave">{p.texto}</span>
            </li>
          ))}
        </ol>

        <h3 className="pt-2 text-lg">O que as pessoas avaliam</h3>
        {/* Blocos na cor de cada estímulo, como na página do lugar, com o personagem em destaque */}
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ESTIMULOS.map((e, i) => (
            <li
              key={e}
              className="relative flex min-h-48 flex-col overflow-hidden rounded-[24px] p-4 pb-24 text-tinta"
              style={{ background: COR_ESTIMULO[e], border: "var(--linha) solid var(--borda)" }}
            >
              <strong className="display text-2xl">{INFO_ESTIMULO[e].nome}</strong>
              <span className="mt-1 text-sm">{INFO_ESTIMULO[e].cobre}</span>
              <Personagem
                forma={e}
                rosto={i % 2 ? "feliz" : "calmo"}
                branco
                className="pointer-events-none absolute -bottom-3 -right-3 h-28 w-28 rotate-[-8deg]"
              />
            </li>
          ))}
        </ul>

        <div className="cartao space-y-3 bg-fundo p-4 text-sm">
          <p className="text-base font-bold">A carinha mostra o nível</p>
          <ul className="grid grid-cols-3 gap-2" aria-label="Exemplo com o som">
            {NIVEIS.map((n) => (
              <li
                key={n}
                className="relative flex min-h-28 flex-col overflow-hidden rounded-[20px] p-3 text-tinta"
                style={{ background: COR_ESTIMULO.som, border: "var(--linha) solid var(--borda)" }}
              >
                <span className="text-xs font-bold">Som</span>
                <span className="display mt-1 text-2xl">{ROTULO_NIVEL[n]}</span>
                <Personagem
                  forma="som"
                  rosto={ROSTO_DO_NIVEL[n]}
                  branco
                  className="pointer-events-none absolute -bottom-3 -right-2.5 h-20 w-20"
                />
              </li>
            ))}
          </ul>
          <p className="text-texto-suave">
            Um estímulo aparece no lugar assim que alguém conta como ele estava, considerando os
            últimos 12 meses. Com poucos relatos, ele vem com um aviso. Os relatos mais recentes
            pesam mais. Com relatos que dizem o horário, o mapa
            também mostra o melhor horário para ir.
          </p>
        </div>

        <div
          className="space-y-3 rounded-3xl bg-destaque-suave p-5"
          style={{ border: "var(--linha) solid var(--borda)" }}
        >
          <h3 className="text-lg">Perfil sensorial</h3>
          <p className="text-sm">
            Com uma conta, você marca os estímulos que mais afetam você. A busca passa a mostrar
            primeiro os lugares mais confortáveis para o seu perfil, e o melhor horário é calculado
            para ele. O perfil é opcional, só fica guardado com a sua autorização e ninguém mais vê.
          </p>
          <div className="flex justify-end">
            <Link href="/perfil" className="botao">
              Montar meu perfil sensorial
            </Link>
          </div>
        </div>
      </Secao>

      <Secao id="dados-abertos" titulo="Dados abertos">
        <div
          className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-3xl bg-destaque-suave p-5 sm:pr-36"
          style={{ border: "var(--linha) solid var(--borda)" }}
        >
          <p className="min-w-0 flex-1 basis-64">
            Os relatos também viram números abertos para a comunidade: quais estímulos mais
            aparecem em cafés, restaurantes, shoppings e outros lugares, e como mudam ao longo da
            semana. Dá para usar em estudos, trabalhos e conversas com os lugares.
          </p>
          <LinkSeta href="/dados">Ver os dados abertos</LinkSeta>
          <Personagem
            forma="lotacao"
            rosto="curioso"
            className="pointer-events-none absolute -bottom-6 -right-4 hidden h-28 w-28 rotate-[-8deg] sm:block"
          />
        </div>
      </Secao>

      <Secao id="como-contribuir" titulo="Como contribuir">
        <p>O mapa só existe com a ajuda de quem conhece os lugares da cidade.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          <li className="cartao space-y-1 bg-fundo p-4 text-sm">
            <strong className="block text-base">Conte como é lá</strong>
            <span className="block text-texto-suave">
              Foi a algum lugar? Leva um minuto: diga como estavam os estímulos e, se lembrar, o
              horário.
            </span>
            <span className="flex flex-wrap gap-x-4">
              <LinkSeta href="/">Abrir o mapa</LinkSeta>
              <LinkSeta href="/avaliar">Avaliar vários lugares de uma vez</LinkSeta>
            </span>
          </li>
          <li className="cartao space-y-1 bg-fundo p-4 text-sm">
            <strong className="block text-base">Adicione um lugar</strong>
            <span className="block text-texto-suave">
              Não achou um lugar na busca? Dá para incluir no mapa.
            </span>
            <LinkSeta href="/lugar/novo">Adicionar lugar</LinkSeta>
          </li>
          <li className="cartao space-y-1 bg-fundo p-4 text-sm">
            <strong className="block text-base">Ajude a cuidar</strong>
            <span className="block text-texto-suave">
              Viu um relato ofensivo, falso ou com dados de alguém? Use o botão “Denunciar” no
              relato. Com denúncias de 2 pessoas, ele sai do ar até a revisão.
            </span>
          </li>
          <li className="cartao space-y-1 bg-fundo p-4 text-sm">
            <strong className="block text-base">Fale com a gente</strong>
            <span className="block text-texto-suave">
              Sugestões, parcerias, problemas no site ou vontade de ajudar a construir o projeto.
            </span>
            {env.emailContato ? (
              <LinkSeta href={`mailto:${env.emailContato}`} externo>
                {env.emailContato}
              </LinkSeta>
            ) : (
              <span className="block italic text-texto-suave">E-mail de contato em breve.</span>
            )}
          </li>
          <li className="cartao flex flex-wrap items-center justify-between gap-3 bg-fundo p-4 text-sm sm:col-span-2">
            <span className="min-w-0 flex-1 space-y-1">
              <strong className="block text-base">Compartilhe o projeto</strong>
              <span className="block text-texto-suave">
                Quanto mais gente conhece, mais lugares ganham relatos. Mande para amigos, famílias,
                grupos e associações.
              </span>
            </span>
            <BotaoCompartilhar
              caminho="/"
              titulo="Mapa Sensorial · como é lá?"
              texto="Conhece o Mapa Sensorial? Dá para ver como são o barulho, a luz, os cheiros e o movimento dos lugares antes de ir, com relatos da comunidade."
              className="shrink-0"
            />
          </li>
        </ul>
      </Secao>

      <Secao id="quem-faz" titulo="Quem faz">
        <div
          className="relative space-y-3 overflow-hidden rounded-[28px] bg-destaque-suave p-6 pr-6 sm:pr-40"
          style={{ border: "var(--linha) solid var(--borda)" }}
        >
          <p className="text-lg font-extrabold tracking-[-0.03em]">Oi! Aqui é Léo Muller.</p>
          <p>
            Sou designer de produto e autor do Mapa Sensorial. Sou autista e tenho TDAH, e recebi os
            dois diagnósticos na vida adulta. Entender meu jeito de funcionar mudou muita coisa: passei a reconhecer por que
            alguns lugares me esgotam e outros não, e o quanto saber antes como é um lugar faz
            diferença.
          </p>
          <p>
            O Mapa Sensorial nasceu dessa vontade: usar o que sei de design para construir, junto
            com a comunidade, uma ferramenta que ajude a ganhar autonomia. Escolher onde ir,
            quando ir e como se preparar, sem depender de sorte nem de pedir explicação para
            alguém.
          </p>
          <p>
            Se você é autista, tem TDAH ou convive com quem é, a sua experiência faz muita
            diferença aqui.
          </p>
          <LinkSeta href="https://www.linkedin.com/in/leormuller" externo>
            Meu LinkedIn
          </LinkSeta>
          <Personagem
            forma="bolha"
            rosto="piscando"
            style={{ "--c-geral": "var(--c-som)" } as CSSProperties}
            className="pointer-events-none absolute -bottom-8 -right-8 hidden h-44 w-44 rotate-[-10deg] sm:block"
          />
        </div>
      </Secao>
    </div>
  );
}
