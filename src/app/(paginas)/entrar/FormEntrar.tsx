"use client";

import { useFormulario } from "@/lib/useFormulario";
import { useState } from "react";
import { FormCodigo } from "@/components/FormCodigo";
import { entrar } from "@/lib/acoes/conta";

export function FormEntrar({ voltar }: { voltar: string }) {
  const [estado, enviar, enviando] = useFormulario(entrar, {});
  // Volta para a etapa do e-mail sem perder o que foi digitado.
  const [trocar, setTrocar] = useState(0);
  const emailEnviado = estado.enviadoPara && trocar === 0 ? estado.enviadoPara : null;

  if (emailEnviado) {
    return (
      <FormCodigo
        email={emailEnviado}
        voltar={voltar}
        aoTrocarEmail={() => setTrocar((n) => n + 1)}
      />
    );
  }

  return (
    <form
      onSubmit={(e) => {
        setTrocar(0);
        enviar(e);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="voltar" value={voltar} />
      <div>
        <label htmlFor="email" className="rotulo">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={estado.enviadoPara ?? ""}
          className="campo"
        />
      </div>
      <div role="alert">{estado.erro && <p className="erro">{estado.erro}</p>}</div>
      <div className="flex justify-end">
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar código"}
        </button>
      </div>
    </form>
  );
}
