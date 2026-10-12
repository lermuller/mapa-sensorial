import type { ReactNode } from "react";
import { percentual } from "@/lib/estatisticas";
import type { MetricasInternas } from "@/lib/metricas";

function Numero({ valor, rotulo, detalhe }: { valor: number | string; rotulo: string; detalhe?: string }) {
  return (
    <div className="cartao p-4">
      <p className="display text-4xl">{typeof valor === "number" ? valor.toLocaleString("pt-BR") : valor}</p>
      <p className="text-sm font-bold">{rotulo}</p>
      {detalhe && <p className="text-xs text-texto-suave">{detalhe}</p>}
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg">{titulo}</h3>
      {children}
    </section>
  );
}

/** Números de uso da plataforma (aba Métricas da conta, só moderação). Só contagens. */
export function PainelMetricas({ m }: { m: MetricasInternas }) {
  const maxSemana = Math.max(1, ...m.relatosPorSemana.map((s) => s.total));
  const dataCurta = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });

  return (
    <div className="space-y-8">
      <Grupo titulo="Relatos">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Numero valor={m.relatos.total} rotulo="no total" detalhe={`${m.relatos.ocultos} ocultos por denúncia`} />
          <Numero valor={m.relatos.ultimos7} rotulo="últimos 7 dias" />
          <Numero valor={m.relatos.ultimos30} rotulo="últimos 30 dias" />
          <Numero
            valor={`${percentual(m.relatos.comTexto, m.relatos.total)}%`}
            rotulo="com “O que esperar”"
            detalhe={`${m.relatos.comTexto} ${m.relatos.comTexto === 1 ? "relato" : "relatos"}`}
          />
        </div>
        <div className="cartao space-y-2 p-4">
          <p className="text-sm font-bold">Relatos por semana</p>
          <ol className="flex h-36 items-end gap-2" aria-label="Relatos nas últimas 8 semanas">
            {m.relatosPorSemana.map((s) => (
              <li key={s.inicio} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-xs font-bold">{s.total}</span>
                <span
                  aria-hidden="true"
                  className="w-full rounded-t-lg bg-destaque"
                  style={{ height: `${Math.max(2, (s.total / maxSemana) * 100)}%` }}
                />
                <span className="text-[0.6875rem] text-texto-suave">
                  <span className="sr-only">semana de </span>
                  {dataCurta(s.inicio)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Grupo>

      <Grupo titulo="Pessoas">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Numero valor={m.contas.total} rotulo="contas" detalhe={`${m.contas.novas7} novas em 7 dias · ${m.contas.novas30} em 30`} />
          <Numero
            valor={m.contas.entraram30}
            rotulo="entraram nos últimos 30 dias"
            detalhe="Usaram o código de acesso no período"
          />
          <Numero
            valor={m.contas.contribuiram30}
            rotulo="contribuíram nos últimos 30 dias"
            detalhe="Publicaram ao menos um relato"
          />
          <Numero
            valor={`${percentual(m.contas.jaRelataram, m.contas.total)}%`}
            rotulo="das contas já relataram"
            detalhe={`${m.contas.jaRelataram} de ${m.contas.total}`}
          />
          <Numero
            valor={m.contas.jaRelataram ? (m.relatos.total / m.contas.jaRelataram).toFixed(1).replace(".", ",") : "0"}
            rotulo="relatos por pessoa que relata"
          />
        </div>
      </Grupo>

      <Grupo titulo="Lugares">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Numero
            valor={m.lugares.avaliados}
            rotulo="lugares avaliados"
            detalhe={`${percentual(m.lugares.avaliados, m.lugares.total)}% dos ${m.lugares.total.toLocaleString("pt-BR")} no mapa`}
          />
          <Numero valor={m.lugares.adicionadosPelaComunidade} rotulo="adicionados pela comunidade" />
          <Numero valor={m.denunciasAbertas} rotulo="denúncias abertas" detalhe="Revisar em Moderação" />
        </div>
        {m.maisRelatados.length > 0 && (
          <div className="cartao p-4">
            <p className="mb-2 text-sm font-bold">Lugares com mais relatos</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {m.maisRelatados.map((l, i) => (
                <li key={i}>
                  {l.nome} <span className="text-texto-suave">· {l.total}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Grupo>
    </div>
  );
}
