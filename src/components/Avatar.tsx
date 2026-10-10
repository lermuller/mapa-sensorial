import type { CSSProperties } from "react";
import { COR_AVATAR, lerAvatar } from "@/lib/avatar";
import { Personagem } from "./Personagem";

/** Avatar da pessoa: um rosto padrão num círculo. Decorativo (o nome vem ao lado). */
export function Avatar({ valor, className = "h-10 w-10" }: { valor: string | null | undefined; className?: string }) {
  const a = lerAvatar(valor);
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-fundo ${className}`}
      style={{ border: "max(1px, var(--linha)) solid var(--borda)" }}
    >
      <Personagem
        forma={a.forma}
        rosto={a.rosto}
        className="h-[88%] w-[88%]"
        style={{ "--c-geral": COR_AVATAR[a.cor] } as CSSProperties}
      />
    </span>
  );
}
