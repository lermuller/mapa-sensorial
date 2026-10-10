"use client";

import { useFormulario } from "@/lib/useFormulario";
import { apagarConta } from "@/lib/acoes/conta";

export function FormApagarConta() {
  const [estado, enviar, enviando] = useFormulario(apagarConta, {});
  return (
    <form onSubmit={enviar} className="space-y-2">
      <label htmlFor="confirmacao" className="rotulo">
        Para confirmar, digite APAGAR
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="confirmacao" name="confirmacao" autoComplete="off" required className="campo" />
        <button type="submit" className="botao botao-perigo" disabled={enviando}>
          {enviando ? "Apagando…" : "Apagar conta"}
        </button>
      </div>
      <div role="alert">{estado.erro && <p className="erro">{estado.erro}</p>}</div>
    </form>
  );
}
