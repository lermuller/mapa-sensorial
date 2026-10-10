import type { ReactNode } from "react";

/**
 * Opção selecionável em formato de pílula, sem checkbox visível. O input continua
 * no HTML (acessível e funciona sem JavaScript); o estado marcado aparece no fundo
 * verde-claro e num ✓, para não depender só da cor.
 */
export function PilulaOpcao({
  tipo = "checkbox",
  name,
  value,
  defaultChecked,
  children,
  icone,
}: {
  tipo?: "checkbox" | "radio";
  name: string;
  value: string;
  defaultChecked?: boolean;
  children: ReactNode;
  /** Personagem ou ícone à esquerda. */
  icone?: ReactNode;
}) {
  return (
    <label
      className={`chip group/pilula font-medium has-focus-visible:outline-3 has-focus-visible:outline-[var(--foco)] ${
        icone ? "chip-personagem" : ""
      }`}
    >
      <input
        type={tipo}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {icone}
      <span>{children}</span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="hidden h-3.5 w-3.5 shrink-0 group-has-checked/pilula:block"
        fill="none"
        stroke="currentColor"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </label>
  );
}
