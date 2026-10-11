import type { CSSProperties, ReactNode } from "react";
import { Personagem, type Forma, type Rosto } from "@/components/Personagem";

/**
 * Bloco selecionável (como os blocos da página do lugar): claro com o personagem colorido;
 * marcado, ganha a cor do estímulo, o personagem branco e um ✓. O input continua no HTML
 * (acessível e funciona sem JavaScript). Usado nos filtros, no perfil e no relato.
 */
export function BlocoOpcao({
  tipo = "checkbox",
  name,
  value,
  defaultChecked,
  cor,
  personagem,
  children,
  horizontal = false,
  className = "",
}: {
  tipo?: "checkbox" | "radio";
  name: string;
  value: string;
  defaultChecked?: boolean;
  /** Cor de fundo quando marcado. Sem ela, o bloco é neutro: marcado fica verde-claro, como as pílulas. */
  cor?: string;
  /** Personagem cortado no canto; sem ele, o bloco fica só com o texto. */
  personagem?: { forma: Forma; rosto: Rosto };
  children: ReactNode;
  /** Bloco baixo, com o texto e o ✓ na mesma linha (ex.: "Não reparei"). */
  horizontal?: boolean;
  className?: string;
}) {
  return (
    <label
      className={`group/bloco relative flex cursor-pointer ${horizontal ? "flex-row items-center" : "flex-col"} justify-between overflow-hidden rounded-[20px] bg-fundo p-3 text-texto ${cor ? "has-checked:bg-[var(--cor)] has-checked:text-tinta" : "has-checked:bg-destaque-suave"} has-focus-visible:outline-3 has-focus-visible:outline-[var(--foco)] ${className}`}
      style={
        {
          "--cor": cor,
          border: "max(1px, var(--linha)) solid var(--borda)",
        } as CSSProperties
      }
    >
      <input
        type={tipo}
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {/* Se não couber, quebra com hífen em vez de cortar */}
      <span className="relative z-10 hyphens-auto break-words text-base font-extrabold leading-tight tracking-[-0.03em]">
        {children}
      </span>
      <span
        aria-hidden="true"
        className={`relative z-10 hidden h-6 w-6 shrink-0 items-center justify-center rounded-full group-has-checked/bloco:flex ${cor ? "bg-tinta" : "bg-texto"}`}
        style={{ color: cor ? "#ffffff" : "var(--fundo)" }}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      {/* Personagem cortado no canto: colorido sem marcar, branco quando marcado */}
      {personagem && (
        <>
          <Personagem
            forma={personagem.forma}
            rosto={personagem.rosto}
            className="pointer-events-none absolute -bottom-2 -right-1.5 h-16 w-16 group-has-checked/bloco:hidden"
          />
          <Personagem
            forma={personagem.forma}
            rosto={personagem.rosto}
            branco
            className="pointer-events-none absolute -bottom-2 -right-1.5 hidden h-16 w-16 group-has-checked/bloco:block"
          />
        </>
      )}
    </label>
  );
}
