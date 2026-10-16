"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Botão de envio que mostra que está carregando (busca, filtros). Sem animação, como o
 * resto do site: o texto muda e o leitor de tela é avisado.
 */
export function BotaoEnviar({
  children,
  carregando,
  className = "botao",
}: {
  children: ReactNode;
  /** Texto enquanto carrega, como "Buscando…". */
  carregando: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} aria-disabled={pending}>
      {pending ? carregando : children}
      <span role="status" className="sr-only">
        {pending ? carregando : ""}
      </span>
    </button>
  );
}
