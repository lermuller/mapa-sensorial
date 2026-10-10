"use client";

import { useState } from "react";
import { IconeCategoria } from "@/components/IconeCategoria";
import { CATEGORIAS, ROTULO_CATEGORIA, type Categoria } from "@/lib/estimulos";

const CHECK = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Pílulas de tipo de lugar com a opção "Todos". Nenhum tipo marcado = todos.
 * Marcar "Todos" desmarca os outros; marcar um tipo desliga "Todos".
 */
export function TiposDeLugar({ iniciais }: { iniciais: Categoria[] }) {
  const [marcados, setMarcados] = useState<Categoria[]>(iniciais);
  const todos = marcados.length === 0;

  function alternar(c: Categoria) {
    setMarcados((atual) => (atual.includes(c) ? atual.filter((x) => x !== c) : [...atual, c]));
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        aria-pressed={todos}
        onClick={() => setMarcados([])}
        className={`chip font-medium ${todos ? "bg-destaque-suave" : ""}`}
      >
        Todos
        {todos && CHECK}
      </button>
      {CATEGORIAS.map((c) => {
        const marcado = marcados.includes(c);
        return (
          <label
            key={c}
            className={`chip chip-personagem font-medium has-focus-visible:outline-3 has-focus-visible:outline-[var(--foco)] ${
              marcado ? "bg-destaque-suave" : ""
            }`}
          >
            <input
              type="checkbox"
              name="tipo"
              value={c}
              checked={marcado}
              onChange={() => alternar(c)}
              className="sr-only"
            />
            <IconeCategoria categoria={c} className="h-7 w-7" />
            <span>{ROTULO_CATEGORIA[c]}</span>
            {marcado && CHECK}
          </label>
        );
      })}
    </div>
  );
}
