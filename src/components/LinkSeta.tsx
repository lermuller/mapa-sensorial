import Link from "next/link";
import type { ReactNode } from "react";

/** Link solto (fora de frases): sem sublinhado e com seta. "voltar" põe a seta antes. */
export function LinkSeta({
  href,
  children,
  voltar = false,
  externo = false,
  scroll,
  className = "",
}: {
  href: string;
  children: ReactNode;
  voltar?: boolean;
  externo?: boolean;
  /** false: navega sem rolar a página (painéis sobre o mapa). */
  scroll?: boolean;
  className?: string;
}) {
  const seta = (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 shrink-0 ${voltar ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
  const conteudo = voltar ? (
    <>
      {seta}
      {children}
    </>
  ) : (
    <>
      {children}
      {seta}
    </>
  );
  const classe = `link-seta ${className}`;
  return externo ? (
    <a href={href} className={classe}>
      {conteudo}
    </a>
  ) : (
    <Link href={href} scroll={scroll} className={classe}>
      {conteudo}
    </Link>
  );
}
