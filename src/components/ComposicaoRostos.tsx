import type { CSSProperties, ReactNode } from "react";
import { Personagem } from "./Personagem";

/**
 * Composição com os rostos padrão (IDENTIDADE.md › Composições): título grande em área
 * limpa e até três personagens cortados nas bordas, nunca sobre o texto. Por ser uma peça
 * sobre a comunidade, os rostos usam cores de estímulos para mostrar diversidade.
 */
export function ComposicaoRostos({ titulo, children }: { titulo: ReactNode; children?: ReactNode }) {
  return (
    <div
      className="relative min-h-56 overflow-hidden rounded-[28px] bg-destaque-suave p-6 pb-32 sm:min-h-72 md:h-full md:min-h-[26rem] md:p-8"
      style={{ border: "var(--linha) solid var(--borda)" }}
    >
      <div className="relative z-10 max-w-[16rem] space-y-2 sm:max-w-xs">
        <p className="display text-[2rem] sm:text-[2.5rem]">{titulo}</p>
        {children && <div className="text-sm">{children}</div>}
      </div>

      {/* Personagens cortados nas bordas inferior e direita */}
      <Personagem
        forma="bolha"
        rosto="feliz"
        className="pointer-events-none absolute -bottom-10 -right-8 h-44 w-44 rotate-[-10deg] sm:h-56 sm:w-56 md:h-64 md:w-64"
      />
      <Personagem
        forma="bloco"
        rosto="piscando"
        style={{ "--c-geral": "var(--c-som)" } as CSSProperties}
        className="pointer-events-none absolute -bottom-6 left-6 h-24 w-24 rotate-[8deg] sm:h-28 sm:w-28 md:left-8 md:h-32 md:w-32"
      />
      <Personagem
        forma="octogono"
        rosto="curioso"
        style={{ "--c-geral": "var(--c-luz)" } as CSSProperties}
        className="pointer-events-none absolute right-6 top-6 hidden h-20 w-20 rotate-[12deg] sm:block md:right-8 md:top-auto md:bottom-56 md:h-24 md:w-24"
      />
    </div>
  );
}
