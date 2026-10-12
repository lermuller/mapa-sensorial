import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { VoltarAoMapa } from "@/components/LinkSeta";
import { Personagem } from "@/components/Personagem";
import { ROTULO_DIA, NOME_PERIODO } from "@/lib/calculo";
import { COR_ESTIMULO, ESTIMULOS, INFO_ESTIMULO, nivelNaFrase } from "@/lib/estimulos";
import {
  MINIMO_PUBLICO,
  percentual,
  resumirFaixas,
  resumirGrupos,
  suficiente,
  type Contagem,
  type RelatoEstatistica,
} from "@/lib/estatisticas";

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="cartao p-4">
      <p className="display text-4xl">{valor.toLocaleString("pt-BR")}</p>
      <p className="text-sm text-texto-suave">{rotulo}</p>
    </div>
  );
}

/** Barra com a parte de avaliações "alto" de um estímulo. O número vem escrito ao lado. */
function BarraAlto({ estimulo, c }: { estimulo: (typeof ESTIMULOS)[number]; c: Contagem }) {
  const nome = INFO_ESTIMULO[estimulo].nome;
  if (!suficiente(c)) {
    return (
      <li className="text-sm">
        <span className="font-bold">{nome}</span>{" "}
        <span className="text-texto-suave">
          · poucos dados ({c.avaliacoes} {c.avaliacoes === 1 ? "avaliação" : "avaliações"})
        </span>
      </li>
    );
  }
  const p = percentual(c.alto, c.avaliacoes);
  return (
    <li className="space-y-1 text-sm">
      <p>
        <span className="font-bold">{nome}</span>{" "}
        <span>
          {p}% {nivelNaFrase(estimulo, "alto")}
        </span>{" "}
        <span className="text-texto-suave">· {c.avaliacoes} avaliações</span>
      </p>
      <div
        aria-hidden="true"
        className="h-3 overflow-hidden rounded-full bg-fundo"
        style={{ border: "max(1px, var(--linha)) solid var(--borda)" }}
      >
        <div className="h-full rounded-full" style={{ width: `${p}%`, background: COR_ESTIMULO[estimulo] }} />
      </div>
    </li>
  );
}

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

/** Conteúdo da página de dados abertos, a partir dos relatos já lidos. */
export function PainelDados({
  relatos,
  lugaresAvaliados,
}: {
  relatos: RelatoEstatistica[];
  lugaresAvaliados: number;
}) {
  const grupos = resumirGrupos(relatos).sort((a, b) =>
    a.id === "todos" ? -1 : b.id === "todos" ? 1 : b.relatos - a.relatos,
  );
  const faixas = resumirFaixas(relatos);
  const avaliacoes = relatos.reduce(
    (s, r) => s + ESTIMULOS.filter((e) => r.intensidades[e] !== null).length,
    0,
  );
  const atualizado = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <header className="space-y-4">
        <VoltarAoMapa />
        <div className="relative overflow-hidden rounded-[28px] bg-destaque-suave p-6 sm:pr-48" style={{ border: "var(--linha) solid var(--borda)" }}>
          <h1 className="display text-4xl">Dados abertos</h1>
          <p className="mt-3">
            O que a comunidade conta sobre os lugares do Brasil, em números. Use à vontade em
            estudos, trabalhos, conversas com lugares e políticas públicas, citando o Mapa Sensorial.
          </p>
          <p className="mt-2 text-sm">Atualizado em {atualizado}.</p>
          <Personagem
            forma="lotacao"
            rosto="curioso"
            className="pointer-events-none absolute -bottom-8 -right-6 hidden h-44 w-44 rotate-[-8deg] sm:block"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Numero valor={relatos.length} rotulo="relatos publicados" />
          <Numero valor={lugaresAvaliados} rotulo="lugares avaliados" />
          <Numero valor={avaliacoes} rotulo="avaliações de estímulos" />
        </div>
      </header>

      <Secao id="tipos" titulo="O que mais aparece em cada tipo de lugar">
        <p className="text-texto-suave">
          Para cada estímulo, a parte das avaliações em que ele foi relatado como alto. Só aparecem
          tipos de lugar com pelo menos {MINIMO_PUBLICO} relatos.
        </p>
        {grupos.length === 0 ? (
          <p className="cartao p-4">
            Ainda são poucos relatos para mostrar estatísticas. Os números aparecem quando houver
            pelo menos {MINIMO_PUBLICO} relatos. <Link href="/">Conte como é um lugar</Link>.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {grupos.map((g) => (
              <li key={g.id} className="cartao space-y-3 p-4">
                <div>
                  <h3 className="text-lg">{g.rotulo}</h3>
                  <p className="text-sm text-texto-suave">{g.relatos} relatos</p>
                </div>
                {g.maisAlto && (
                  <p
                    className="rounded-2xl p-3 text-sm text-tinta"
                    style={{ background: COR_ESTIMULO[g.maisAlto.estimulo] } as CSSProperties}
                  >
                    Mais relatado como alto:{" "}
                    <strong>
                      {INFO_ESTIMULO[g.maisAlto.estimulo].nome} ({g.maisAlto.percentual}%)
                    </strong>
                  </p>
                )}
                <ul className="space-y-2.5" aria-label={`Estímulos em ${g.rotulo.toLowerCase()}`}>
                  {ESTIMULOS.map((e) => (
                    <BarraAlto key={e} estimulo={e} c={g.porEstimulo[e]} />
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <Secao id="horarios" titulo="Ao longo da semana">
        <p className="text-texto-suave">
          Parte das avaliações relatadas como alto, por dia e horário da visita. Só entram os
          relatos que dizem quando a pessoa foi. Com menos de {MINIMO_PUBLICO} avaliações, o número
          não aparece (—).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">
              Percentual de avaliações altas por estímulo, dia e horário
            </caption>
            <thead>
              <tr className="text-left">
                <th scope="col" className="pb-2 pr-3">
                  Quando
                </th>
                <th scope="col" className="pb-2 pr-3">
                  Relatos
                </th>
                {ESTIMULOS.map((e) => (
                  <th key={e} scope="col" className="pb-2 pr-3">
                    {INFO_ESTIMULO[e].nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {faixas.map((f) => (
                <tr key={`${f.dia}-${f.periodo}`} className="border-t border-borda">
                  <th scope="row" className="py-2 pr-3 text-left font-bold">
                    {ROTULO_DIA[f.dia]}, {NOME_PERIODO[f.periodo].toLowerCase()}
                  </th>
                  <td className="py-2 pr-3">{f.relatos}</td>
                  {ESTIMULOS.map((e) => {
                    const c = f.porEstimulo[e];
                    return (
                      <td key={e} className="py-2 pr-3">
                        {suficiente(c) ? `${percentual(c.alto, c.avaliacoes)}%` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao id="baixar" titulo="Baixar os dados">
        <p>
          Os números por tipo de lugar estão disponíveis em CSV, com a contagem de avaliações baixas,
          médias e altas de cada estímulo.
        </p>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <a href="/dados/csv" download className="botao">
            Baixar CSV
          </a>
        </div>
        <p className="text-sm text-texto-suave">
          Licença{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/deed.pt-br">
            Creative Commons Atribuição 4.0 (CC BY 4.0)
          </a>
          : pode copiar, adaptar e publicar, inclusive em trabalhos comerciais, desde que cite
          “Mapa Sensorial (mapasensorial.org)”.
        </p>
      </Secao>

      <Secao id="metodo" titulo="Como os números são feitos">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Entram todos os relatos publicados no site, desde o início. Relatos ocultos por
            denúncia, à espera de revisão, ficam de fora.
          </li>
          <li>
            Em cada relato, a pessoa diz se cada estímulo estava baixo, médio ou alto, ou que não
            reparou. “Não reparei” não conta como avaliação.
          </li>
          <li>
            O tipo de lugar vem do OpenStreetMap. Cafés, restaurantes e lanchonetes aparecem
            separados; os lugares adicionados pelas pessoas entram em “Todos os lugares” e no tipo
            escolhido por elas.
          </li>
          <li>
            Números com menos de {MINIMO_PUBLICO} avaliações não aparecem, para evitar conclusões
            com poucos relatos.
          </li>
          <li>
            Os dados são só sobre os lugares. Não entram nomes, contas, textos dos relatos nem os
            perfis sensoriais das pessoas. Veja a{" "}
            <Link href="/privacidade">Política de privacidade</Link>.
          </li>
          <li>
            São relatos de quem foi, não medições. Mostram como as pessoas percebem os lugares.
          </li>
        </ul>
      </Secao>
    </div>
  );
}
