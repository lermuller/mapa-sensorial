import Link from "next/link";
import { BadgeSensorial } from "@/components/BadgeSensorial";
import { IconeCategoria } from "@/components/IconeCategoria";
import type { ResultadoBusca } from "@/lib/dados";
import { localDoLugar } from "@/lib/formato";
import { ESTIMULOS, ROTULO_CATEGORIA, type Estimulo } from "@/lib/estimulos";

const CLASSE_LINK =
  "text-texto no-underline after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none";

/** Card da lista de resultados. O card inteiro abre o lugar no painel sobre o mapa. */
export function CartaoLugar({
  lugar,
  estimulos,
  href,
  selecionado = false,
  externo = false,
  Titulo = "h3",
}: {
  lugar: ResultadoBusca;
  estimulos: Estimulo[];
  href: string;
  selecionado?: boolean;
  /** Lugar do OpenStreetMap que ainda não está na base: abrir grava o lugar (link comum, sem pré-carregar). */
  externo?: boolean;
  Titulo?: "h3" | "h4";
}) {
  // Os estímulos da busca (filtros e perfil) aparecem primeiro.
  const ordem = [...estimulos, ...ESTIMULOS.filter((e) => !estimulos.includes(e))];
  const badges = ordem.map((e) => lugar.badges[e]).filter((b) => b !== null);
  return (
    <article
      className={`relative flex gap-3 rounded-3xl bg-fundo p-3 hover:bg-destaque-suave has-focus-visible:outline-3 has-focus-visible:outline-[var(--foco)] ${
        selecionado ? "outline-3 outline-offset-1 outline-texto" : ""
      }`}
      style={{ border: "var(--linha) solid var(--borda)" }}
    >
      <IconeCategoria categoria={lugar.categoria} className="mt-0.5 h-8 w-8" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Titulo className="text-base leading-snug">
          {/* O link cobre o card todo (after:inset-0) */}
          {externo ? (
            <a href={href} rel="nofollow" className={CLASSE_LINK}>
              {lugar.nome}
            </a>
          ) : (
            <Link href={href} scroll={false} className={CLASSE_LINK}>
              {lugar.nome}
            </Link>
          )}
        </Titulo>
        <p className="text-sm text-texto">
          {[ROTULO_CATEGORIA[lugar.categoria], localDoLugar(lugar)].filter(Boolean).join(" · ")}
        </p>
        {externo ? (
          <p className="text-[0.8125rem] italic text-texto-suave">Ainda sem relatos. Seja a primeira pessoa a contar.</p>
        ) : lugar.totalRelatos === 0 ? (
          <p className="text-[0.8125rem] italic text-texto-suave">
            Ninguém contou como é aqui ainda. Você já foi?
          </p>
        ) : badges.length === 0 ? (
          <p className="text-[0.8125rem] italic text-texto-suave">
            {lugar.totalRelatos === 1 ? "1 pessoa contou" : `${lugar.totalRelatos} pessoas contaram`}{" "}
            como é. Ainda é pouco para mostrar os estímulos.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1" aria-label="Estímulos relatados">
            {badges.map((b) => (
              <li key={b.estimulo}>
                <BadgeSensorial badge={b} compacto />
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
