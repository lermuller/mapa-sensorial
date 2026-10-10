"use client";

import { useFormulario } from "@/lib/useFormulario";
import type { EstadoForm } from "@/lib/acoes/relatos";
import { LinkSeta } from "@/components/LinkSeta";

export function FormDenuncia({
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
          Denúncia enviada. Obrigado por avisar.
        </p>
        <LinkSeta href={voltar} voltar>Voltar para os relatos</LinkSeta>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div>
        <label htmlFor="motivo" className="rotulo">
          Motivo
        </label>
        <textarea id="motivo" name="motivo" rows={4} maxLength={1000} required className="campo" />
      </div>
      <div role="alert">{estado.erro && <p className="erro">{estado.erro}</p>}</div>
      <button type="submit" className="botao" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar denúncia"}
      </button>
    </form>
  );
}
