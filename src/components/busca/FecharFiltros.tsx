"use client";

import { useEffect, useRef } from "react";

/** Fecha o <details> dos filtros em que está, pelo botão ou com Esc. */
export function FecharFiltros() {
  const botao = useRef<HTMLButtonElement>(null);

  // Esc dentro dos filtros fecha o painel e volta o foco para o botão "Filtros".
  useEffect(() => {
    const detalhes = botao.current?.closest("details");
    if (!detalhes) return;
    function tecla(e: KeyboardEvent) {
      if (e.key !== "Escape" || !detalhes?.open) return;
      e.preventDefault();
      fechar(detalhes);
    }
    detalhes.addEventListener("keydown", tecla);
    return () => detalhes.removeEventListener("keydown", tecla);
  }, []);

  return (
    <button
      ref={botao}
      type="button"
      aria-label="Fechar filtros"
      title="Fechar"
      onClick={(e) => {
        const detalhes = e.currentTarget.closest("details");
        if (detalhes) fechar(detalhes);
      }}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-borda bg-fundo text-texto"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

function fechar(detalhes: HTMLDetailsElement) {
  detalhes.open = false;
  detalhes.querySelector("summary")?.focus();
}
