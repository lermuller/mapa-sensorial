import type { Badge } from "@/lib/calculo";
import { COR_ESTIMULO, INFO_ESTIMULO, rotuloNivel } from "@/lib/estimulos";
import { Personagem, ROSTO_DO_NIVEL } from "./Personagem";

/**
 * Badge de estímulo: fundo na cor do estímulo, personagem branco cujo rosto
 * mostra o nível, e o nível sempre escrito.
 */
export function BadgeSensorial({
  badge,
  destaque = false,
  compacto = false,
}: {
  badge: Badge;
  /** O estímulo está no perfil sensorial da pessoa. */
  destaque?: boolean;
  compacto?: boolean;
}) {
  const nome = INFO_ESTIMULO[badge.estimulo].nome;
  const nivel = rotuloNivel(badge.estimulo, badge.nivel).toLowerCase();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold text-tinta ${
        compacto ? "py-0.5 pl-0.5 pr-2.5 text-xs" : "py-1 pl-1 pr-3 text-sm"
      } ${destaque ? "outline-2 outline-offset-2 outline-texto" : ""}`}
      style={{
        background: COR_ESTIMULO[badge.estimulo],
        border: "var(--linha) solid var(--borda)",
      }}
    >
      <Personagem
        forma={badge.estimulo}
        rosto={ROSTO_DO_NIVEL[badge.nivel]}
        branco
        className={compacto ? "h-5 w-5" : "h-7 w-7"}
      />
      <span>
        {nome} <span className="font-normal">{nivel}</span>
        {destaque && <span className="sr-only"> (está no seu perfil)</span>}
        {!compacto && badge.poucosRelatos && (
          <span className="font-normal"> · poucos relatos</span>
        )}
      </span>
    </span>
  );
}
