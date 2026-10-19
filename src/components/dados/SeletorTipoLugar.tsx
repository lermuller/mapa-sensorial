"use client";

import Link from "next/link";
import { useState } from "react";
import { PilulaOpcao } from "@/components/PilulaOpcao";
import { COR_ESTIMULO, ESTIMULOS, INFO_ESTIMULO, nivelNaFrase, type Estimulo } from "@/lib/estimulos";
import { MINIMO_PUBLICO, percentual, type Contagem, type ResumoGrupo } from "@/lib/estatisticas";

/** Barra com a parte de avaliações "alto" de um estímulo. O número vem escrito ao lado. */
function BarraAlto({ estimulo, c }: { estimulo: Estimulo; c: Contagem }) {
  const nome = INFO_ESTIMULO[estimulo].nome;
  if (c.avaliacoes === 0) {
    return (
      <li className="text-sm">
        <span className="font-bold">{nome}</span> <span className="text-texto-suave">· ainda sem avaliações</span>
      </li>
    );
  }
  const p = percentual(c.alto, c.avaliacoes);
  return (
    <li className="space-y-1 text-sm">
      <p>
        <span className="font-bold">{nome}</span>{" "}
        <span>
          {p}% {nivelNaFrase(estimulo, "alto")}
        </span>{" "}
        <span className="text-texto-suave">
          · {c.avaliacoes} {c.avaliacoes === 1 ? "avaliação" : "avaliações"}
        </span>
      </p>
      <div
        aria-hidden="true"
        className="h-3 overflow-hidden rounded-full bg-fundo"
        style={{ border: "max(1px, var(--linha)) solid var(--borda)" }}
      >
        <div className="h-full rounded-full" style={{ width: `${p}%`, background: COR_ESTIMULO[estimulo] }} />
      </div>
    </li>
  );
}

/**
 * Escolha do tipo de lugar ("Todos", "Cafés", "Restaurantes"…) e o resumo dele: os estímulos
 * mais relatados como altos primeiro. Tipos com poucos relatos aparecem com aviso.
 */
export function SeletorTipoLugar({ grupos }: { grupos: ResumoGrupo[] }) {
  const [escolhido, setEscolhido] = useState("todos");
  const g = grupos.find((x) => x.id === escolhido) ?? grupos[0];
  // Do mais relatado como alto para o menos; estímulos sem avaliações vão para o fim.
  const ordem = [...ESTIMULOS].sort((a, b) => {
    const ca = g.porEstimulo[a];
    const cb = g.porEstimulo[b];
    if (!ca.avaliacoes || !cb.avaliacoes) return cb.avaliacoes - ca.avaliacoes;
    return percentual(cb.alto, cb.avaliacoes) - percentual(ca.alto, ca.avaliacoes);
  });

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="rotulo">Tipo de lugar</legend>
        <div className="flex flex-wrap gap-1.5">
          {grupos.map((x) => (
            <PilulaOpcao
              key={x.id}
              tipo="radio"
              name="tipo-dados"
              value={x.id}
              checked={x.id === g.id}
              onChange={() => setEscolhido(x.id)}
            >
              {x.rotulo} <span className="text-texto-suave">({x.relatos})</span>
            </PilulaOpcao>
          ))}
        </div>
      </fieldset>

      <section aria-live="polite" aria-labelledby="titulo-tipo-escolhido" className="cartao space-y-3 p-4">
        <div>
          <h3 id="titulo-tipo-escolhido" className="text-lg">
            {g.rotulo}
          </h3>
          <p className="text-sm text-texto-suave">
            {g.relatos} {g.relatos === 1 ? "relato" : "relatos"}
          </p>
        </div>

        {g.relatos === 0 ? (
          <p className="text-sm">
            Ainda não há relatos deste tipo de lugar.{" "}
            <Link href="/avaliar">Avalie os que você conhece</Link>.
          </p>
        ) : (
          <>
            {g.amostraPequena && (
              <p className="rounded-2xl bg-fundo p-3 text-sm" style={{ border: "max(1px, var(--linha)) solid var(--borda)" }}>
                <strong>Amostra pequena:</strong> menos de {MINIMO_PUBLICO} relatos. Os números ainda
                podem mudar bastante; use com cuidado.
              </p>
            )}
            {g.maisAlto && (
              <p className="rounded-2xl p-3 text-sm text-tinta" style={{ background: COR_ESTIMULO[g.maisAlto.estimulo] }}>
                Mais relatado como alto:{" "}
                <strong>
                  {INFO_ESTIMULO[g.maisAlto.estimulo].nome} ({g.maisAlto.percentual}%)
                </strong>
              </p>
            )}
            <ul className="space-y-2.5" aria-label={`Estímulos em ${g.rotulo.toLowerCase()}`}>
              {ordem.map((e) => (
                <BarraAlto key={e} estimulo={e} c={g.porEstimulo[e]} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
