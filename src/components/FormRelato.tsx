"use client";

import { useFormulario } from "@/lib/useFormulario";
import { useState } from "react";
import type { EstadoForm } from "@/lib/acoes/relatos";
import type { RelatoLinha } from "@/lib/dados";
import { ESTIMULOS, INFO_ESTIMULO } from "@/lib/estimulos";
import { Personagem } from "./Personagem";

const OPCOES = [
  { valor: "", rotulo: "Não reparei" },
  { valor: "0", rotulo: "Baixo" },
  { valor: "1", rotulo: "Médio" },
  { valor: "2", rotulo: "Alto" },
];

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
        {ESTIMULOS.map((e) => (
          <fieldset key={e} className="cartao">
            <legend className="flex items-center gap-2 px-1 font-bold">
              <Personagem forma={e} rosto="calmo" className="h-9 w-9" />
              {INFO_ESTIMULO[e].nome}
            </legend>
            <p className="ajuda mb-2">{INFO_ESTIMULO[e].cobre}</p>
            <div className="grid grid-cols-2 gap-2 @md:grid-cols-4">
              {OPCOES.map((o) => {
                const atual = inicial?.[e];
                const marcado = (atual === null || atual === undefined ? "" : String(atual)) === o.valor;
                return (
                  <label
                    key={o.valor}
                    className="chip min-h-10 justify-start has-checked:outline-2 has-checked:outline-texto"
                  >
                    <input
                      type="radio"
                      name={e}
                      value={o.valor}
                      defaultChecked={marcado}
                      className="h-5 w-5 accent-destaque"
                    />
                    {o.rotulo}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-xl font-extrabold tracking-[-0.035em]">Quando você foi</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="quando"
            value="data"
            checked={quando === "data"}
            onChange={() => setQuando("data")}
            className="h-5 w-5 accent-destaque"
          />
          Num dia e horário específicos
        </label>
        {quando === "data" && (
          <div className="grid gap-3 pl-7 sm:grid-cols-2">
            <div>
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
                className="campo"
              />
            </div>
            <div>
              <label htmlFor="hora" className="rotulo">
                Horário aproximado
              </label>
              <input
                id="hora"
                name="hora"
                type="time"
                required
                defaultValue={inicial?.hora?.slice(0, 5) ?? ""}
                className="campo"
              />
            </div>
          </div>
        )}
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="quando"
            value="sempre"
            checked={quando === "sempre"}
            onChange={() => setQuando("sempre")}
            className="h-5 w-5 accent-destaque"
          />
          É sempre assim
        </label>
        {quando === "sempre" && (
          <>
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
