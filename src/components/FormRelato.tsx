"use client";

import { useFormulario } from "@/lib/useFormulario";
import { useState } from "react";
import type { EstadoForm } from "@/lib/acoes/relatos";
import type { RelatoLinha } from "@/lib/dados";
import { COR_ESTIMULO, ESTIMULOS, INFO_ESTIMULO, NIVEIS, rotuloNivel } from "@/lib/estimulos";
import { BlocoOpcao } from "./BlocoOpcao";
import { PilulaOpcao } from "./PilulaOpcao";
import { ROSTO_DO_NIVEL } from "./Personagem";

export function FormRelato({
  acao,
  inicial,
  hoje,
  textoBotao,
}: {
  acao: (anterior: EstadoForm, form: FormData) => Promise<EstadoForm>;
  inicial?: RelatoLinha;
  /** AAAA-MM-DD em Porto Alegre, para limitar a data. */
  hoje: string;
  textoBotao: string;
}) {
  const [estado, enviar, enviando] = useFormulario(acao, {});
  const [quando, setQuando] = useState<"sempre" | "data">(
    inicial ? (inicial.sempre_assim ? "sempre" : "data") : "data",
  );

  return (
    <form onSubmit={enviar} className="@container space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-xl font-extrabold tracking-[-0.035em]">Como estava</legend>
        <p className="ajuda">
          Para cada um, diga como estava. Se não reparou, deixe em “Não reparei”. Avalie pelo menos
          um.
        </p>
        {ESTIMULOS.map((e) => {
          const atual = inicial?.[e];
          const valorAtual = atual === null || atual === undefined ? "" : String(atual);
          return (
            <fieldset key={e} className="space-y-2">
              <legend className="text-lg font-extrabold tracking-[-0.03em]">
                {INFO_ESTIMULO[e].nome}
              </legend>
              <p className="ajuda -mt-1">{INFO_ESTIMULO[e].cobre}</p>
              {/* Blocos como nos filtros: os 3 níveis lado a lado e "Não reparei" embaixo */}
              <div className="grid grid-cols-3 gap-2">
                {NIVEIS.map((n, i) => (
                  <BlocoOpcao
                    key={n}
                    tipo="radio"
                    name={e}
                    value={String(i)}
                    defaultChecked={valorAtual === String(i)}
                    cor={COR_ESTIMULO[e]}
                    personagem={{ forma: e, rosto: ROSTO_DO_NIVEL[n] }}
                    className="min-h-22"
                  >
                    {rotuloNivel(e, n)}
                  </BlocoOpcao>
                ))}
                <BlocoOpcao
                  tipo="radio"
                  name={e}
                  value=""
                  defaultChecked={valorAtual === ""}
                  horizontal
                  className="col-span-3 min-h-11 py-2"
                >
                  Não reparei
                </BlocoOpcao>
              </div>
            </fieldset>
          );
        })}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-xl font-extrabold tracking-[-0.035em]">Quando você foi</legend>
        {/* Pílulas como nos filtros, no lugar de botões de rádio */}
        <div className="flex flex-wrap gap-1.5">
          <PilulaOpcao
            tipo="radio"
            name="quando"
            value="data"
            checked={quando === "data"}
            onChange={() => setQuando("data")}
          >
            Num dia e horário
          </PilulaOpcao>
          <PilulaOpcao
            tipo="radio"
            name="quando"
            value="sempre"
            checked={quando === "sempre"}
            onChange={() => setQuando("sempre")}
          >
            É sempre assim
          </PilulaOpcao>
        </div>
        {quando === "data" ? (
          // min-w-0: no iPhone os campos de data e hora têm largura mínima própria e
          // empurravam o painel para os lados.
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label htmlFor="data" className="rotulo">
                Data
              </label>
              <input
                id="data"
                name="data"
                type="date"
                max={hoje}
                required
                defaultValue={inicial?.data ?? hoje}
                className="campo campo-data"
              />
            </div>
            <div className="min-w-0">
              <label htmlFor="hora" className="rotulo">
                Horário aproximado
              </label>
              <input
                id="hora"
                name="hora"
                type="time"
                required
                defaultValue={inicial?.hora?.slice(0, 5) ?? ""}
                className="campo campo-data"
              />
            </div>
          </div>
        ) : (
          <>
            <p className="ajuda">O lugar costuma ser assim em qualquer dia e horário.</p>
            <input type="hidden" name="data" value="" />
            <input type="hidden" name="hora" value="" />
          </>
        )}
      </fieldset>

      <div>
        <label htmlFor="o_que_esperar" className="rotulo text-xl">
          O que esperar (opcional)
        </label>
        <p id="ajuda-esperar" className="ajuda mb-1">
          Ajude quem vai pela primeira vez. Por exemplo: “tem revista na entrada”, “a praça de
          alimentação fica lotada no almoço”.
        </p>
        <textarea
          id="o_que_esperar"
          name="o_que_esperar"
          rows={3}
          maxLength={1000}
          aria-describedby="ajuda-esperar"
          defaultValue={inicial?.o_que_esperar ?? ""}
          className="campo"
        />
      </div>

      <div>
        <label htmlFor="comentario" className="rotulo text-xl">
          Comentário (opcional)
        </label>
        <p id="ajuda-comentario" className="ajuda mb-1">
          Descreva o lugar, não pessoas. Não escreva dados de saúde.
        </p>
        <textarea
          id="comentario"
          name="comentario"
          rows={3}
          maxLength={2000}
          aria-describedby="ajuda-comentario"
          defaultValue={inicial?.comentario ?? ""}
          className="campo"
        />
      </div>

      <div role="alert">{estado.erro && <p className="erro">{estado.erro}</p>}</div>

      {/* Ação principal à direita */}
      <div className="flex justify-end">
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? "Salvando…" : textoBotao}
        </button>
      </div>
    </form>
  );
}
