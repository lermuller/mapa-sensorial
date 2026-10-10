import { DIAS_FAIXA, PERIODOS_FAIXA, ROTULO_DIA, ROTULO_PERIODO } from "@/lib/calculo";
import Form from "next/form";
import Link from "next/link";
import { BlocoSensibilidade } from "@/components/BlocoSensibilidade";
import { Interruptor } from "@/components/Interruptor";
import { PilulaOpcao } from "@/components/PilulaOpcao";
import { TiposDeLugar } from "./TiposDeLugar";
import { FecharFiltros } from "./FecharFiltros";
import {
  ESTIMULOS,
  INFO_ESTIMULO,
  type Estimulo,
} from "@/lib/estimulos";
import { areaParaTexto, type ParamsBusca } from "@/lib/parametros";

/** Filtros num formulário GET comum: funciona sem JavaScript. */
export function Filtros({
  params,
  perfilConta,
}: {
  params: ParamsBusca;
  /** Perfil sensorial da conta; null quando a pessoa não entrou. */
  perfilConta: Estimulo[] | null;
}) {
  const ativos =
    params.categorias.length +
    params.estimulos.length +
    (params.faixa.dia ? 1 : 0) +
    (params.faixa.periodo ? 1 : 0);

  return (
    <details className="group relative">
      <summary
        className={`chip min-h-11 list-none shadow-suave [&::-webkit-details-marker]:hidden ${ativos > 0 ? "bg-destaque-suave" : ""}`}
      >
        Filtros{ativos > 0 ? ` (${ativos})` : ""}
        <span aria-hidden="true" className="group-open:rotate-180">▾</span>
      </summary>
      {/* key: recria o formulário quando os filtros da URL mudam (ex.: "Limpar filtros"),
          para as opções marcadas acompanharem a busca atual. */}
      <Form
        key={[
          params.estimulos.join(","),
          params.categorias.join(","),
          params.faixa.dia ?? "",
          params.faixa.periodo ?? "",
          params.usarPerfil ? "p" : "",
        ].join("|")}
        action="/"
        className="absolute right-0 top-full z-30 mt-2 flex max-h-[70vh] w-[min(36rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-3xl bg-superficie shadow-suave"
        style={{ border: "var(--linha) solid var(--borda)" }}
      >
        {/* Topo e rodapé fixos; só o conteúdo do meio rola */}
        <div className="flex items-center justify-between gap-3 border-b border-borda px-4 py-2.5">
          <p className="text-lg font-extrabold tracking-[-0.035em]">Filtros</p>
          <FecharFiltros />
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
        {params.termo && <input type="hidden" name="q" value={params.termo} />}
        {params.area && <input type="hidden" name="area" value={areaParaTexto(params.area)} />}
        <input type="hidden" name="f" value="1" />

        <fieldset>
          {/* Título só para leitores de tela: o interruptor já diz o que é */}
          <legend className="sr-only">Meu perfil sensorial</legend>
          {perfilConta === null ? (
            <Link href="/entrar?voltar=/" className="botao-terciario -ml-3">
              Entrar para usar meu perfil
              <SetaTerciaria />
            </Link>
          ) : perfilConta.length === 0 ? (
            <Link href="/perfil" className="botao-terciario -ml-3">
              Montar meu perfil sensorial
              <SetaTerciaria />
            </Link>
          ) : (
            <div className="space-y-1.5">
              <Interruptor name="perfil" defaultChecked={params.usarPerfil}>
                Usar meu perfil sensorial
              </Interruptor>
              <p className="ajuda">
                Mostra primeiro os lugares mais confortáveis para{" "}
                {perfilConta.map((e) => INFO_ESTIMULO[e].nome.toLowerCase()).join(", ")}.{" "}
                <Link href="/perfil">Ajustar</Link>
              </p>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="rotulo">Tipos de sensibilidade</legend>
          <p className="ajuda mb-2">Mostra primeiro os lugares mais tranquilos nesses estímulos.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ESTIMULOS.map((e) => (
              <BlocoSensibilidade
                key={e}
                name="sens"
                estimulo={e}
                defaultChecked={params.estimulos.includes(e)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="rotulo">Tipo de lugar</legend>
          <TiposDeLugar iniciais={params.categorias} />
        </fieldset>

        <fieldset>
          <legend className="rotulo">Quando vou (opcional)</legend>
          <p className="ajuda mb-2">Usa os relatos desse horário quando houver.</p>
          <div className="space-y-2">
            <div role="radiogroup" aria-label="Dia" className="flex flex-wrap gap-1.5">
              <PilulaOpcao tipo="radio" name="dia" value="" defaultChecked={!params.faixa.dia}>
                Qualquer dia
              </PilulaOpcao>
              {DIAS_FAIXA.map((d) => (
                <PilulaOpcao
                  key={d}
                  tipo="radio"
                  name="dia"
                  value={d}
                  defaultChecked={params.faixa.dia === d}
                >
                  {ROTULO_DIA[d]}
                </PilulaOpcao>
              ))}
            </div>
            <div role="radiogroup" aria-label="Horário" className="flex flex-wrap gap-1.5">
              <PilulaOpcao
                tipo="radio"
                name="periodo"
                value=""
                defaultChecked={!params.faixa.periodo}
              >
                Qualquer horário
              </PilulaOpcao>
              {PERIODOS_FAIXA.map((p) => (
                <PilulaOpcao
                  key={p}
                  tipo="radio"
                  name="periodo"
                  value={p}
                  defaultChecked={params.faixa.periodo === p}
                >
                  {ROTULO_PERIODO[p]}
                </PilulaOpcao>
              ))}
            </div>
          </div>
        </fieldset>

        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-borda bg-superficie px-4 py-3">
          <Link
            href={`/?f=1${params.termo ? `&q=${encodeURIComponent(params.termo)}` : ""}`}
            className="botao botao-secundario"
          >
            Limpar filtros
          </Link>
          <button type="submit" className="botao">
            Aplicar filtros
          </button>
        </div>
      </Form>
    </details>
  );
}

function SetaTerciaria() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
