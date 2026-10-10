"use client";

import { useFormulario } from "@/lib/useFormulario";
import { useState } from "react";
import { FormCodigo } from "@/components/FormCodigo";
import { BlocoSensibilidade } from "@/components/BlocoSensibilidade";
import { cadastrar } from "@/lib/acoes/conta";
import { ESTIMULOS } from "@/lib/estimulos";

export function FormCadastro({ voltar }: { voltar: string }) {
  const [estado, enviar, enviando] = useFormulario(cadastrar, {});
  // Etapa do código. O formulário fica só escondido, para "Usar outro e-mail" não apagar nada.
  const [trocar, setTrocar] = useState(0);
  const emailEnviado = estado.enviadoPara && trocar === 0 ? estado.enviadoPara : null;

  return (
    <>
      {emailEnviado && (
        <FormCodigo
          cadastro
          email={emailEnviado}
          voltar={voltar}
          aoTrocarEmail={() => setTrocar((n) => n + 1)}
        />
      )}
      <form
        onSubmit={(e) => {
          setTrocar(0);
          enviar(e);
        }}
        hidden={!!emailEnviado}
        className="space-y-4"
      >
        <input type="hidden" name="voltar" value={voltar} />
        <div>
          <label htmlFor="nome" className="rotulo">
            Nome
          </label>
          <p id="ajuda-nome" className="ajuda mb-1">
            Não aparece para ninguém.
          </p>
          <input
            id="nome"
            name="nome"
            autoComplete="name"
            required
            maxLength={120}
            aria-describedby="ajuda-nome"
            className="campo"
          />
        </div>
        <div>
          <label htmlFor="nome_publico" className="rotulo">
            Nome público
          </label>
          <p id="ajuda-nome-publico" className="ajuda mb-1">
            Aparece nos seus relatos. Pode ser um apelido ou só o primeiro nome.
          </p>
          <input
            id="nome_publico"
            name="nome_publico"
            autoComplete="nickname"
            required
            maxLength={40}
            aria-describedby="ajuda-nome-publico"
            className="campo"
          />
        </div>
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
            className="campo"
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="rotulo">Perfil sensorial (opcional)</legend>
          <p className="ajuda">
            Marque os estímulos que mais afetam você. Assim a busca mostra primeiro os lugares mais
            confortáveis para o seu perfil. Pode deixar em branco e montar depois.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ESTIMULOS.map((e) => (
              <BlocoSensibilidade key={e} name="perfil" estimulo={e} defaultChecked={false} />
            ))}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              name="consentimento"
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--tinta)]"
            />
            <span>
              Autorizo guardar meu perfil sensorial na minha conta para personalizar as buscas. Sei
              que posso apagar quando quiser, e que ele nunca aparece para outras pessoas.
              <span className="ajuda"> (Só é preciso se marcar algum estímulo.)</span>
            </span>
          </label>
        </fieldset>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="aceite"
            required
            className="mt-1.5 h-5 w-5 shrink-0 accent-destaque"
          />
          <span>
            Concordo com os termos de uso e a política de privacidade.{" "}
            <span className="ajuda">(Textos em elaboração.)</span>
          </span>
        </label>
        <div role="alert">{estado.erro && <p className="erro">{estado.erro}</p>}</div>
        <div className="flex justify-end">
          <button type="submit" className="botao" disabled={enviando}>
            {enviando ? "Enviando…" : "Criar conta"}
          </button>
        </div>
      </form>
    </>
  );
}
