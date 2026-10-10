"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  COOKIE_CONTRASTE,
  COOKIE_TEMA,
  type Contraste,
  type Tema,
} from "@/lib/aparencia";

const OPCOES_TEMA: { valor: Tema; rotulo: string }[] = [
  { valor: "auto", rotulo: "Automático" },
  { valor: "claro", rotulo: "Claro" },
  { valor: "escuro", rotulo: "Escuro" },
];

const OPCOES_CONTRASTE: { valor: Contraste; rotulo: string }[] = [
  { valor: "auto", rotulo: "Automático" },
  { valor: "suave", rotulo: "Suave" },
  { valor: "alto", rotulo: "Alto" },
];

function gravar(nome: string, valor: string) {
  // Um ano; vale para o site todo.
  document.cookie = `${nome}=${valor}; path=/; max-age=31536000; SameSite=Lax`;
}

/** Aplica a escolha no <html> na hora, sem recarregar. */
function aplicarNoHtml(atributo: "data-tema" | "data-contraste", valor: string | null) {
  if (valor) document.documentElement.setAttribute(atributo, valor);
  else document.documentElement.removeAttribute(atributo);
}

/** Botão fixo no canto inferior direito com as opções de tema e contraste. */
export function SeletorAparencia({
  temaInicial,
  contrasteInicial,
}: {
  temaInicial: Tema;
  contrasteInicial: Contraste;
}) {
  const [aberto, setAberto] = useState(false);
  const [tema, setTema] = useState(temaInicial);
  const [contraste, setContraste] = useState(contrasteInicial);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const idPainel = useId();

  // Fecha ao clicar fora ou com Esc.
  useEffect(() => {
    if (!aberto) return;
    function clique(e: MouseEvent) {
      if (!raiz.current?.contains(e.target as Node)) setAberto(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAberto(false);
        botao.current?.focus();
      }
    }
    document.addEventListener("mousedown", clique);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", clique);
      document.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  function escolherTema(t: Tema) {
    setTema(t);
    gravar(COOKIE_TEMA, t);
    aplicarNoHtml("data-tema", t === "auto" ? null : t);
  }

  function escolherContraste(c: Contraste) {
    setContraste(c);
    gravar(COOKIE_CONTRASTE, c);
    aplicarNoHtml("data-contraste", c === "auto" ? null : c);
  }

  return (
    // flex-col-reverse: o painel aparece acima do botão, mas vem depois dele no HTML,
    // para o Tab seguir do botão direto para as opções.
    <div ref={raiz} className="fixed bottom-4 right-3 z-40 flex flex-col-reverse items-end gap-2 sm:right-4">
      <button
        ref={botao}
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-controls={idPainel}
        aria-label="Aparência: tema e contraste"
        title="Aparência"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-borda bg-fundo text-texto shadow-suave"
      >
        {/* Círculo meio cheio: símbolo comum de tema/contraste */}
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
        </svg>
      </button>
      {aberto && (
        <div
          id={idPainel}
          role="group"
          aria-label="Aparência"
          className="w-72 space-y-4 rounded-3xl border border-borda bg-fundo p-4 shadow-suave"
        >
          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-sm font-bold">Tema</legend>
            <div className="grid grid-cols-3 gap-1 rounded-full bg-superficie p-1">
              {OPCOES_TEMA.map((o) => (
                <label
                  key={o.valor}
                  className="cursor-pointer whitespace-nowrap rounded-full px-2 py-1 text-center text-xs font-semibold has-checked:bg-destaque has-checked:text-destaque-texto has-focus-visible:outline-2 has-focus-visible:outline-current"
                >
                  <input
                    type="radio"
                    name="tema"
                    value={o.valor}
                    checked={tema === o.valor}
                    onChange={() => escolherTema(o.valor)}
                    className="sr-only"
                  />
                  {o.rotulo}
                </label>
              ))}
            </div>
            {tema === "auto" && <p className="ajuda text-xs">Segue o modo do seu aparelho.</p>}
          </fieldset>

          <fieldset className="space-y-1.5">
            <legend className="mb-1.5 text-sm font-bold">Contraste</legend>
            <div className="grid grid-cols-3 gap-1 rounded-full bg-superficie p-1">
              {OPCOES_CONTRASTE.map((o) => (
                <label
                  key={o.valor}
                  className="cursor-pointer whitespace-nowrap rounded-full px-2 py-1 text-center text-xs font-semibold has-checked:bg-destaque has-checked:text-destaque-texto has-focus-visible:outline-2 has-focus-visible:outline-current"
                >
                  <input
                    type="radio"
                    name="contraste"
                    value={o.valor}
                    checked={contraste === o.valor}
                    onChange={() => escolherContraste(o.valor)}
                    className="sr-only"
                  />
                  {o.rotulo}
                </label>
              ))}
            </div>
            <p className="ajuda text-xs">
              {contraste === "auto"
                ? "Segue a configuração de contraste do seu aparelho."
                : contraste === "suave"
                  ? "Cores claras e calmas, sem contornos."
                  : "Preto e branco, contornos fortes e cores vivas."}
            </p>
          </fieldset>
        </div>
      )}

    </div>
  );
}
