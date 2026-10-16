"use client";

import { LinkSeta } from "@/components/LinkSeta";
import { PilulaOpcao } from "@/components/PilulaOpcao";
import type { EstadoForm } from "@/lib/acoes/relatos";
import { useFormulario } from "@/lib/useFormulario";

const MOTIVOS = [
  { valor: "nao_existe", rotulo: "Não existe ou fechou" },
  { valor: "local_errado", rotulo: "Está no lugar errado do mapa" },
  { valor: "nome_errado", rotulo: "Nome ou tipo de lugar errado" },
  { valor: "duplicado", rotulo: "Está repetido no mapa" },
  { valor: "ofensivo", rotulo: "Nome ofensivo ou propaganda" },
  { valor: "outro", rotulo: "Outro problema" },
];

export function FormProblema({
  acao,
  voltar,
}: {
  acao: (anterior: EstadoForm, form: FormData) => Promise<EstadoForm>;
  voltar: string;
}) {
  const [estado, enviar, enviando] = useFormulario(acao, {});

  if (estado.ok) {
    return (
      <div className="space-y-3">
        <p className="sucesso" role="status">
          Obrigado por avisar! A moderação vai olhar este lugar.
        </p>
        <LinkSeta href={voltar} voltar>
          Voltar para o lugar
        </LinkSeta>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="rotulo">Qual é o problema?</legend>
        <div className="flex flex-wrap gap-1.5">
          {MOTIVOS.map((m) => (
            <PilulaOpcao key={m.valor} tipo="radio" name="motivo" value={m.valor}>
              {m.rotulo}
            </PilulaOpcao>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="detalhe" className="rotulo">
          Detalhes (opcional)
        </label>
        <p id="ajuda-detalhe" className="ajuda mb-1">
          Ajuda a moderação: o nome certo, onde o lugar fica de verdade ou qual é o lugar repetido.
          Obrigatório em “Está repetido” e “Outro problema”.
        </p>
        <textarea
          id="detalhe"
          name="detalhe"
          rows={3}
          maxLength={1000}
          aria-describedby="ajuda-detalhe"
          className="campo"
        />
      </div>
      <div role="alert">{estado.erro && <p className="erro">{estado.erro}</p>}</div>
      <div className="flex justify-end">
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </form>
  );
}
