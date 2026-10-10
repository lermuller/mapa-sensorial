import type { ReactNode } from "react";
import { LinkSeta } from "@/components/LinkSeta";

/** Segundo nível dentro do painel do lugar (relatos, contar como é lá), com volta ao resumo. */
export function SubpainelLugar({
  nomeLugar,
  hrefVoltar,
  titulo,
  children,
}: {
  nomeLugar: string;
  hrefVoltar: string;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <article aria-labelledby="titulo-subpainel" className="space-y-4">
      <LinkSeta href={hrefVoltar} voltar scroll={false} className="text-sm">
        {nomeLugar}
      </LinkSeta>
      <h2 id="titulo-subpainel" className="display pr-10 text-[1.75rem]">
        {titulo}
      </h2>
      {children}
    </article>
  );
}
