"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { OpcaoLugar } from "@/lib/avaliacoes";

/**
 * Campo para escolher o lugar de uma linha: digita o nome e escolhe nas sugestões
 * (lugares do mapa e do Brasil todo). Padrão combobox, como a busca do mapa.
 */
export function EscolherLugar({
  rotulo,
  escolhido,
  textoInicial = "",
  aoEscolher,
}: {
  rotulo: string;
  escolhido: OpcaoLugar | null;
  /** Texto já digitado (ex.: vindo da planilha), para buscar de cara. */
  textoInicial?: string;
  aoEscolher: (o: OpcaoLugar | null) => void;
}) {
  const id = useId();
  const [texto, setTexto] = useState(textoInicial);
  const [opcoes, setOpcoes] = useState<OpcaoLugar[]>([]);
  const [aberta, setAberta] = useState(false);
  const [ativa, setAtiva] = useState(-1);
  const [buscando, setBuscando] = useState(false);
  const pedido = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = texto.trim();
    if (escolhido || q.length < 2) return;
    const espera = setTimeout(async () => {
      pedido.current?.abort();
      const controle = new AbortController();
      pedido.current = controle;
      // A busca no Brasil todo leva alguns segundos: a lista abre já com "Buscando…".
      setOpcoes([]);
      setBuscando(true);
      setAberta(true);
      try {
        const r = await fetch(`/buscar-lugar?q=${encodeURIComponent(q)}`, { signal: controle.signal });
        const { lugares } = (await r.json()) as { lugares: OpcaoLugar[] };
        setOpcoes(lugares);
        setAtiva(-1);
        setAberta(true);
      } catch {
        // Cancelada por uma nova tecla.
      } finally {
        if (pedido.current === controle) setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(espera);
  }, [texto, escolhido]);

  function escolher(o: OpcaoLugar) {
    setAberta(false);
    aoEscolher(o);
  }

  function tecla(e: KeyboardEvent<HTMLInputElement>) {
    if (!aberta || opcoes.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtiva((a) => (a + 1) % opcoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtiva((a) => (a <= 0 ? opcoes.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      setAberta(false);
    } else if (e.key === "Enter") {
      // Enter não envia o formulário enquanto a lista está aberta.
      e.preventDefault();
      if (ativa >= 0) escolher(opcoes[ativa]);
    }
  }

  if (escolhido) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-destaque-suave px-3 py-2">
        <span className="min-w-0">
          <span className="block font-bold">{escolhido.nome}</span>
          <span className="block text-xs">{escolhido.detalhe}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            setTexto(escolhido.nome);
            aoEscolher(null);
          }}
          className="botao-terciario text-sm"
          aria-label={`Trocar o lugar (${escolhido.nome})`}
        >
          Trocar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <label htmlFor={`${id}-campo`} className="sr-only">
        {rotulo}
      </label>
      <input
        id={`${id}-campo`}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={tecla}
        onFocus={() => opcoes.length > 0 && setAberta(true)}
        onBlur={() => setAberta(false)}
        role="combobox"
        aria-expanded={aberta}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        aria-activedescendant={ativa >= 0 ? `${id}-op-${ativa}` : undefined}
        autoComplete="off"
        placeholder="Nome do lugar e, se quiser, o bairro ou a cidade"
        className="campo"
      />
      <p role="status" className="sr-only">
        {aberta ? `${opcoes.length} lugares encontrados. Use as setas para escolher.` : ""}
      </p>
      {aberta && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          aria-label="Lugares encontrados"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-2xl bg-fundo p-1.5 shadow-suave"
          style={{ border: "max(1px, var(--linha)) solid var(--borda)" }}
        >
          {opcoes.length === 0 ? (
            <li className="px-3 py-2 text-sm text-texto-suave">
              {buscando ? "Buscando…" : "Nenhum lugar encontrado. Tente outro nome ou inclua a cidade."}
            </li>
          ) : (
            opcoes.map((o, i) => (
              <li
                key={o.ref}
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={i === ativa}
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(o);
                }}
                onMouseEnter={() => setAtiva(i)}
                className={`cursor-pointer rounded-xl px-3 py-2 ${i === ativa ? "bg-destaque-suave" : ""}`}
              >
                <span className="block truncate font-bold">{o.nome}</span>
                <span className="block truncate text-xs text-texto-suave">{o.detalhe}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
