"use client";

import { useFormulario } from "@/lib/useFormulario";
import { entrar, verificarCodigo } from "@/lib/acoes/conta";

/** Segunda etapa do login e do cadastro: digitar o código que chegou por e-mail. */
export function FormCodigo({
  email,
  voltar,
  aoTrocarEmail,
  cadastro = false,
}: {
  email: string;
  voltar: string;
  aoTrocarEmail: () => void;
  cadastro?: boolean;
}) {
  const [estado, enviar, enviando] = useFormulario(verificarCodigo, {});
  const [reenvio, reenviar, reenviando] = useFormulario(entrar, {});

  return (
    <div className="space-y-4">
      <div className="sucesso space-y-1" role="status">
        <p>
          <strong>Confira seu e-mail.</strong>
        </p>
        <p>
          {cadastro
            ? `Enviamos um código para ${email}.`
            : `Se ${email} tiver conta, enviamos um código para entrar.`}{" "}
          Pode abrir o e-mail em qualquer aparelho. Se não chegar em alguns minutos, veja o spam.
        </p>
      </div>

      <form onSubmit={enviar} className="space-y-3">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="voltar" value={voltar} />
        <div>
          <label htmlFor="codigo" className="rotulo">
            Código
          </label>
          <input
            id="codigo"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,12}"
            maxLength={12}
            required
            autoFocus
            className="campo text-center font-mono text-2xl tracking-[0.4em]"
          />
        </div>
        <div role="alert">{estado.erro && <p className="erro">{estado.erro}</p>}</div>
        <div className="flex justify-end">
          <button type="submit" className="botao" disabled={enviando}>
            {enviando ? "Conferindo…" : "Entrar"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borda pt-3 text-sm">
        <button type="button" onClick={aoTrocarEmail} className="botao-terciario -ml-3">
          Usar outro e-mail
        </button>
        <form onSubmit={reenviar}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="voltar" value={voltar} />
          <button type="submit" className="botao-terciario -mr-3" disabled={reenviando}>
            {reenviando
              ? "Enviando…"
              : reenvio.enviadoPara
                ? "Código reenviado"
                : "Reenviar código"}
          </button>
        </form>
      </div>
    </div>
  );
}
