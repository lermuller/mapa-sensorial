import type { CSSProperties } from "react";
import { Personagem } from "@/components/Personagem";
import { COR_ESTIMULO, INFO_ESTIMULO, type Estimulo } from "@/lib/estimulos";

/**
 * Bloco selecionável de sensibilidade, como os blocos da página do lugar: claro com o
 * personagem colorido; marcado, ganha a cor do estímulo, o personagem branco e um ✓.
 */
export function BlocoSensibilidade({
  estimulo,
  defaultChecked,
  name,
}: {
  estimulo: Estimulo;
  defaultChecked: boolean;
  /** Nome do campo no formulário ("sens" nos filtros, "perfil" no perfil). */
  name: string;
}) {
  return (
    <label
      className="group/bloco relative flex min-h-22 cursor-pointer flex-col justify-between overflow-hidden rounded-[20px] bg-fundo p-3 text-texto has-checked:bg-[var(--cor)] has-checked:text-tinta has-focus-visible:outline-3 has-focus-visible:outline-[var(--foco)]"
      style={
        {
          "--cor": COR_ESTIMULO[estimulo],
          border: "max(1px, var(--linha)) solid var(--borda)",
        } as CSSProperties
      }
    >
      <input
        type="checkbox"
        name={name}
        value={estimulo}
        defaultChecked={defaultChecked}
        className="sr-only"
      />
      {/* Tamanho que cabe nos blocos estreitos; se não couber, quebra com hífen em vez de cortar */}
      <span className="relative z-10 hyphens-auto break-words text-base font-extrabold leading-tight tracking-[-0.03em]">
        {INFO_ESTIMULO[estimulo].nome}
      </span>
      <span
        aria-hidden="true"
        className="hidden h-6 w-6 items-center justify-center rounded-full bg-tinta text-[var(--cor)] group-has-checked/bloco:flex"
        style={{ color: "#ffffff" }}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      {/* Personagem cortado no canto: colorido sem marcar, branco quando marcado */}
      <Personagem
        forma={estimulo}
        rosto="calmo"
        className="pointer-events-none absolute -bottom-2 -right-1.5 h-16 w-16 group-has-checked/bloco:hidden"
      />
      <Personagem
        forma={estimulo}
        rosto="calmo"
        branco
        className="pointer-events-none absolute -bottom-2 -right-1.5 hidden h-16 w-16 group-has-checked/bloco:block"
      />
    </label>
  );
}
