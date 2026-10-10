"use client";

import { useFormulario } from "@/lib/useFormulario";
import { BlocoSensibilidade } from "@/components/BlocoSensibilidade";
import { apagarPerfil, salvarPerfil } from "@/lib/acoes/conta";
import { ESTIMULOS, type Estimulo } from "@/lib/estimulos";

export function FormPerfil({
  perfil,
  semTitulo = false,
}: {
  perfil: Estimulo[];
  /** Sem a legenda visível (quando a seção em volta já tem título). */
  semTitulo?: boolean;
}) {
  const [estado, enviar, enviando] = useFormulario(salvarPerfil, {});

  return (
    <div className="space-y-6">
      <form onSubmit={enviar} className="space-y-4">
        <fieldset>
          <legend
            className={semTitulo ? "sr-only" : "mb-2 text-lg font-extrabold tracking-[-0.035em]"}
          >
            Meus tipos de sensibilidade
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ESTIMULOS.map((e) => (
              <BlocoSensibilidade
                key={e}
                name="perfil"
                estimulo={e}
                defaultChecked={perfil.includes(e)}
              />
            ))}
          </div>
        </fieldset>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consentimento"
            defaultChecked={perfil.length > 0}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--tinta)]"
          />
          <span>
            Autorizo guardar meu perfil sensorial na minha conta para personalizar as buscas. Sei
            que posso apagar quando quiser, e que ele nunca aparece para outras pessoas.{" "}
            <a href="/privacidade#perfil" target="_blank" rel="noopener">
              Como cuidamos do perfil
            </a>
            .
          </span>
        </label>

        <div role="status">
          {estado.ok && <p className="sucesso">Perfil salvo na sua conta.</p>}
          {estado.erro && <p className="erro">{estado.erro}</p>}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="botao" disabled={enviando}>
            {enviando ? "Salvando…" : "Salvar meu perfil"}
          </button>
        </div>
      </form>

      {perfil.length > 0 && (
        <form action={apagarPerfil} className="space-y-2 border-t border-borda pt-4">
          <input type="hidden" name="voltar" value={semTitulo ? "/conta" : "/perfil"} />
          <p className="ajuda">Apaga o perfil e a autorização da sua conta. Dá para montar de novo depois.</p>
          <button type="submit" className="botao botao-perigo">
            Apagar meu perfil
          </button>
        </form>
      )}
    </div>
  );
}
