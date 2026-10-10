import type { CSSProperties } from "react";
import type { Estimulo, Nivel } from "@/lib/estimulos";

// Personagens da identidade visual (docs/identidade/IDENTIDADE.md), do sprite
// src/assets/personagens.svg, embutido em todas as páginas por <SpritePersonagens />.
// Formas de estímulo só quando o assunto é o estímulo; formas padrão para a comunicação geral.

export type FormaPadrao = "bolha" | "bloco" | "triangulo" | "octogono";
export type Forma = Estimulo | FormaPadrao;
export type Rosto = "calmo" | "ok" | "alto" | "feliz" | "curioso" | "piscando";

/** A cara indica a intensidade. Sempre com o nível escrito ao lado. */
export const ROSTO_DO_NIVEL: Record<Nivel, Rosto> = {
  baixo: "calmo",
  medio: "ok",
  alto: "alto",
};

/** Dentro de blocos e badges na cor do estímulo, o personagem vai branco para não sumir. */
const BRANCO = {
  "--c-som": "#ffffff",
  "--c-luz": "#ffffff",
  "--c-cheiro": "#ffffff",
  "--c-lotacao": "#ffffff",
  "--c-visual": "#ffffff",
  "--c-temperatura": "#ffffff",
  "--c-geral": "#ffffff",
} as CSSProperties;

export function Personagem({
  forma,
  rosto,
  className = "h-8 w-8",
  branco = false,
  style,
}: {
  forma: Forma;
  rosto: Rosto;
  className?: string;
  branco?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="-10 -10 120 120"
      aria-hidden="true"
      focusable="false"
      // overflow visível: as formas passam um pouco do viewBox e não devem ser cortadas
      // (quando o corte é intencional, quem corta é o bloco em volta).
      overflow="visible"
      className={`shrink-0 ${className}`}
      style={branco ? { ...BRANCO, ...style } : style}
    >
      <use href={`#p-${forma}-${rosto}`} />
    </svg>
  );
}

/** Símbolo da marca (só a forma). A cor vem de --simbolo. */
export function Simbolo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 235 214" aria-hidden="true" focusable="false" className={`shrink-0 text-simbolo ${className}`}>
      <path
        fill="currentColor"
        d="M22.7169 14.4782L78.434 0.518414C92.4905 -3.00339 103.159 12.1472 96.4226 23.941C96.08 24.4477 95.7487 24.9617 95.4247 25.4802C95.2326 25.7453 95.0341 26.0103 94.8225 26.2704L94.8585 26.4084C88.1018 37.752 85.7541 51.7065 89.4414 65.4675C96.6866 92.5073 124.48 108.554 151.519 101.308C167.681 96.9779 179.912 85.3061 185.593 70.8429C193.132 58.7557 212.27 60.8526 216.387 75.3821L233.632 136.249C238.194 152.351 228.698 169.073 212.533 173.404L65.0318 212.927C54.3626 215.786 43.3958 209.454 40.5369 198.785L1.03007 51.3434C-3.30771 35.1546 6.45947 18.5514 22.7169 14.4782Z"
      />
    </svg>
  );
}
