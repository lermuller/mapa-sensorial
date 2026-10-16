"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

// Avisos de carregamento ao clicar em links (painel do lugar, lista, botões).
// O site não usa animações (conforto sensorial), então o aviso é estático: um texto curto,
// também anunciado para leitores de tela. Devem ficar dentro de um <Link>.

/** Selo "Abrindo…" no canto do cartão enquanto o lugar carrega. */
export function SeloAbrindo() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      role="status"
      className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-texto px-2.5 py-1 text-xs font-bold text-fundo"
    >
      Abrindo…
    </span>
  );
}

/** Troca o texto do link enquanto carrega ("Contar como é lá" → "Abrindo…"). */
export function TextoAoCarregar({ children, carregando = "Abrindo…" }: { children: ReactNode; carregando?: string }) {
  const { pending } = useLinkStatus();
  return (
    <>
      {pending ? carregando : children}
      <span role="status" className="sr-only">
        {pending ? carregando : ""}
      </span>
    </>
  );
}

/** Seta dos links soltos; enquanto carrega, vira uma ampulheta (mesmo tamanho, sem pular). */
export function SetaDoLink({ voltar = false }: { voltar?: boolean }) {
  const { pending } = useLinkStatus();
  return (
    <>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`h-4 w-4 shrink-0 ${voltar && !pending ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {pending ? (
          // Ampulheta
          <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />
        ) : (
          <path d="M5 12h14M13 6l6 6-6 6" />
        )}
      </svg>
      <span role="status" className="sr-only">
        {pending ? "Carregando" : ""}
      </span>
    </>
  );
}

/** Ícone X dos botões de fechar; enquanto carrega, vira ampulheta. */
export function XDoLink() {
  const { pending } = useLinkStatus();
  return (
    <>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {pending ? (
          <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />
        ) : (
          <path d="M6 6l12 12M18 6L6 18" />
        )}
      </svg>
      <span role="status" className="sr-only">
        {pending ? "Carregando" : ""}
      </span>
    </>
  );
}
