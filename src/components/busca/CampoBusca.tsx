"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent } from "react";
import type { Sugestao } from "@/lib/busca";

const ROTULO_TIPO: Record<Sugestao["tipo"], string> = {
  tipo: "Tipo de lugar",
  lugar: "Lugar",
  regiao: "Bairro ou cidade",
};

/**
 * Campo da busca com sugestões enquanto a pessoa digita (lugares, bairros, cidades e tipos).
 * Segue o padrão combobox: setas para escolher, Enter para abrir, Esc para fechar. Sem
 * sugestão escolhida, o Enter envia o formulário normalmente.
 */
export function CampoBusca({
  valorInicial,
  perto,
}: {
  valorInicial: string;
  /** Centro da área do mapa, para sugerir bairros e cidades próximos primeiro. */
  perto?: { lat: number; lng: number };
}) {
  const router = useRouter();
  const id = useId();
  const [texto, setTexto] = useState(valorInicial);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [aberta, setAberta] = useState(false);
  const [ativa, setAtiva] = useState(-1);
  const [buscando, setBuscando] = useState(false);
  const [abrindo, iniciarAbertura] = useTransition();
  const [abrindoExterno, setAbrindoExterno] = useState(false);
  const pedido = useRef<AbortController | null>(null);

  // Sugestões com uma pequena espera depois da última tecla.
  useEffect(() => {
    const q = texto.trim();
    if (q.length < 2 || q === valorInicial.trim()) {
      pedido.current?.abort();
      return;
    }
    const espera = setTimeout(async () => {
      pedido.current?.abort();
      const controle = new AbortController();
      pedido.current = controle;
      setBuscando(true);
      try {
        const u = new URLSearchParams({ q });
        if (perto) {
          u.set("lat", String(perto.lat));
          u.set("lng", String(perto.lng));
        }
        const r = await fetch(`/sugestoes?${u.toString()}`, { signal: controle.signal });
        const { sugestoes } = (await r.json()) as { sugestoes: Sugestao[] };
        setSugestoes(sugestoes);
        setAtiva(-1);
        setAberta(true);
      } catch {
        // Cancelada por uma nova tecla, ou falhou: o Enter continua buscando normalmente.
      } finally {
        if (pedido.current === controle) setBuscando(false);
      }
    }, 250);
    return () => clearTimeout(espera);
  }, [texto, valorInicial, perto]);

  function escolher(s: Sugestao) {
    setAberta(false);
    setTexto(s.tipo === "lugar" ? s.rotulo : texto);
    // Lugar de fora da base: rota que grava e abre (navegação comum, sem pré-carregar).
    if (s.href.startsWith("/lugar-osm/")) {
      setAbrindoExterno(true);
      window.location.assign(s.href);
      return;
    }
    iniciarAbertura(() => router.push(s.href, { scroll: false }));
  }

  function tecla(e: KeyboardEvent<HTMLInputElement>) {
    if (!aberta || sugestoes.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtiva((a) => (a + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtiva((a) => (a <= 0 ? sugestoes.length - 1 : a - 1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setAberta(false);
    } else if (e.key === "Enter" && ativa >= 0) {
      e.preventDefault();
      escolher(sugestoes[ativa]);
    }
  }

  const mostrarLista = aberta && texto.trim().length >= 2;
  const carregando = abrindo || abrindoExterno;

  return (
    <div className="relative min-w-0 flex-1">
      <input
        id="busca"
        name="q"
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={tecla}
        onFocus={() => sugestoes.length > 0 && setAberta(true)}
        // Fecha ao sair do campo; clicar numa sugestão não tira o foco (onMouseDown abaixo).
        onBlur={() => setAberta(false)}
        role="combobox"
        aria-expanded={mostrarLista}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        aria-activedescendant={ativa >= 0 ? `${id}-op-${ativa}` : undefined}
        autoComplete="off"
        className="campo campo-pilula w-full border-transparent shadow-suave"
        placeholder="Lugar, bairro, cidade ou tipo (ex.: cafés)"
      />
      {/* Aviso de carregamento ao abrir uma sugestão (sem animação, como o resto do site) */}
      {carregando && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-destaque-suave px-2.5 py-1 text-xs font-bold">
          Abrindo…
        </span>
      )}
      <p role="status" className="sr-only">
        {carregando
          ? "Abrindo"
          : mostrarLista
            ? sugestoes.length === 0
              ? "Nenhuma sugestão. Aperte Enter para buscar."
              : `${sugestoes.length} sugestões. Use as setas para escolher.`
            : ""}
      </p>
      {mostrarLista && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          aria-label="Sugestões"
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-3xl bg-fundo p-1.5 shadow-suave"
          style={{ border: "max(1px, var(--linha)) solid var(--borda)" }}
        >
          {sugestoes.length === 0 ? (
            <li className="px-3 py-2 text-sm text-texto-suave">
              {buscando ? "Buscando sugestões…" : "Nenhuma sugestão. Aperte Enter para buscar o texto."}
            </li>
          ) : (
            sugestoes.map((s, i) => (
              <li
                key={`${s.tipo}-${s.href}`}
                id={`${id}-op-${i}`}
                role="option"
                aria-selected={i === ativa}
                // mousedown: escolhe antes de o campo perder o foco e fechar a lista
                onMouseDown={(e) => {
                  e.preventDefault();
                  escolher(s);
                }}
                onMouseEnter={() => setAtiva(i)}
                className={`cursor-pointer rounded-2xl px-3 py-2 ${i === ativa ? "bg-destaque-suave" : ""}`}
              >
                <span className="block truncate font-bold">{s.rotulo}</span>
                <span className="block truncate text-xs text-texto-suave">
                  <span className="sr-only">{ROTULO_TIPO[s.tipo]}: </span>
                  {s.detalhe}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
