import type { ReactNode } from "react";
import type { Categoria } from "@/lib/estimulos";

// Ícones dos tipos de lugar, na leveza dos personagens: traço fino e um preenchimento
// verde-claro suave, sem círculo em volta. Não têm rosto: personagens falam de estímulos;
// estes só identificam o tipo do lugar.

/** Preenchimento das formas fechadas */
const P = "var(--destaque-suave)";

const CAMINHOS: Record<Categoria, ReactNode> = {
  shopping: (
    <>
      <path d="M5.5 8.5h13l-1.2 11.5H6.7L5.5 8.5z" fill={P} />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </>
  ),
  supermercado: (
    <>
      <path d="M6.4 8h14.1l-2.3 7.5H8z" fill={P} />
      <path d="M3 4.5h2.2l2.8 11h10.2" />
      <circle cx="9.5" cy="19.5" r="1.5" fill={P} />
      <circle cx="17" cy="19.5" r="1.5" fill={P} />
    </>
  ),
  restaurante_cafe: (
    <>
      <path d="M17 21V3.5c-2.2 1.5-3.3 4.2-3.3 8h3.3" fill={P} />
      <path d="M7 3.5v5.5a2 2 0 0 0 4 0V3.5" />
      <path d="M9 3.5V21" />
    </>
  ),
  parque_praca: (
    <>
      <path d="M12 3a5 5 0 0 0-5 5 4 4 0 0 0 1 7h8a4 4 0 0 0 1-7 5 5 0 0 0-5-5z" fill={P} />
      <path d="M12 21v-6" />
    </>
  ),
  saude: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill={P} />
      <path d="M12 8.5v7M8.5 12h7" />
    </>
  ),
  cultura: (
    <>
      <path
        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5V14a2 2 0 0 0 0-4z"
        fill={P}
      />
      <path d="M14.5 7v1.5M11.25 11.25v1.5M14.5 15.5V17" />
    </>
  ),
  transporte: (
    <>
      <rect x="5" y="3.5" width="14" height="14" rx="3.5" fill={P} />
      <path d="M5 11h14" />
      <path d="M8.5 14.3h.01M15.5 14.3h.01" />
      <path d="M8 17.5V20M16 17.5V20" />
    </>
  ),
  servico_publico: (
    <>
      <path d="M4 9h16l-8-5-8 5z" fill={P} />
      <path d="M3.5 20.5h17" />
      <path d="M6.5 9v8.5M10.5 9v8.5M13.5 9v8.5M17.5 9v8.5" />
    </>
  ),
  outros: (
    <>
      <path d="M12 21s-6-5.5-6-10.5a6 6 0 0 1 12 0C18 15.5 12 21 12 21z" fill={P} />
      <circle cx="12" cy="10.5" r="2" />
    </>
  ),
};

export function IconeCategoria({
  categoria,
  className = "h-7 w-7",
}: {
  categoria: Categoria;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-texto ${className}`}
    >
      {CAMINHOS[categoria]}
    </svg>
  );
}
