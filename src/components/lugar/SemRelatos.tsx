import { LinkSeta } from "@/components/LinkSeta";
import { Personagem } from "@/components/Personagem";

/** Estado vazio: um personagem padrão e o convite para contar. */
export function SemRelatos({ hrefRelatar }: { hrefRelatar: string }) {
  return (
    <div className="cartao relative flex min-h-32 flex-col justify-center overflow-hidden pr-28">
      <p className="text-lg font-extrabold tracking-[-0.03em]">
        Ninguém contou como é aqui ainda. Você já foi?
      </p>
      <p className="mt-2">
        <LinkSeta href={hrefRelatar} scroll={false}>
          Contar como é lá
        </LinkSeta>
      </p>
      <Personagem
        forma="bolha"
        rosto="curioso"
        className="pointer-events-none absolute -bottom-4 -right-3 h-28 w-28 rotate-[-8deg]"
      />
    </div>
  );
}
