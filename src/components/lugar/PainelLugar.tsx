"use client";

import Link from "next/link";
import { TextoAoCarregar } from "@/components/Carregando";
import { IconeCategoria } from "@/components/IconeCategoria";
import { BotaoCompartilhar } from "@/components/BotaoCompartilhar";
import { LinkSeta } from "@/components/LinkSeta";
import { caminhoLugar, textoCompartilhar } from "@/lib/compartilhar";
import type { DetalheLugar } from "@/lib/dados";
import { ROTULO_CATEGORIA, type Estimulo } from "@/lib/estimulos";
import { formatarData, localDoLugar } from "@/lib/formato";
import { ResumoSensorial } from "./ResumoSensorial";
import { SemRelatos } from "./SemRelatos";

/** Detalhe do lugar dentro do painel sobre o mapa (sem sair da página inicial). */
export type HrefsPainel = {
  /** Volta para a lista, mantendo a busca. */
  lista: string;
  /** Resumo do lugar. */
  resumo: string;
  relatos: string;
  relatar: string;
};

export function PainelLugar({
  detalhe,
  hrefs,
  enviado = false,
  perfil = [],
  logado = false,
  podeEditar = false,
}: {
  detalhe: DetalheLugar;
  hrefs: HrefsPainel;
  /** Acabou de publicar um relato. */
  enviado?: boolean;
  /** Perfil sensorial em uso. */
  perfil?: Estimulo[];
  logado?: boolean;
  /** Quem adicionou o lugar (sem relatos de outras pessoas) ou a moderação. */
  podeEditar?: boolean;
}) {
  const { lugar } = detalhe;
  return (
    <article aria-labelledby="titulo-lugar" className="space-y-5">
      <LinkSeta href={hrefs.lista} voltar scroll={false} className="text-sm">
        Lista de lugares
      </LinkSeta>

      <header className="space-y-2.5">
        <div className="flex items-start gap-3">
          <IconeCategoria categoria={lugar.categoria} className="mt-1 h-10 w-10" />
          <div className="min-w-0">
            <h2 id="titulo-lugar" className="display text-[1.75rem]">
              {lugar.nome}
            </h2>
            <p className="mt-1 text-sm text-texto-suave">
              {[ROTULO_CATEGORIA[lugar.categoria], localDoLugar(lugar)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        {/* Ação principal à direita */}
        <div className="flex gap-2">
          <BotaoCompartilhar
            caminho={caminhoLugar(lugar.id)}
            titulo={`${lugar.nome}: como é lá?`}
            texto={textoCompartilhar(detalhe)}
            className="shrink-0 px-3"
          />
          <Link href={hrefs.relatar} scroll={false} className="botao flex-1">
            <TextoAoCarregar>Contar como é lá</TextoAoCarregar>
          </Link>
        </div>
      </header>

      {lugar.talvez_fechado && (
        <p className="erro text-sm">
          <strong>Pode ter fechado.</strong> Algumas pessoas disseram que este lugar não existe mais
          ou fechou. Confira antes de ir.
        </p>
      )}

      {enviado && (
        <p className="sucesso" role="status">
          Pronto, seu relato já aparece no lugar.
        </p>
      )}

      {detalhe.totalRelatos === 0 ? (
        <SemRelatos hrefRelatar={hrefs.relatar} />
      ) : (
        <ResumoSensorial
          badges={detalhe.badges}
          relatos={detalhe.relatos}
          agora={detalhe.agora}
          perfil={perfil}
          logado={logado}
        />
      )}

      {detalhe.oQueEsperar.length > 0 && (
        <section aria-labelledby="o-que-esperar" className="space-y-2">
          <h3 id="o-que-esperar" className="text-lg">
            O que esperar
          </h3>
          <ul className="space-y-2">
            {detalhe.oQueEsperar.map((o) => (
              <li key={o.id} className="rounded-2xl bg-fundo p-3" style={{ border: "var(--linha) solid var(--borda)" }}>
                <p className="whitespace-pre-line text-sm">{o.texto}</p>
                <p className="ajuda mt-1 text-xs">Contado em {formatarData(o.quando)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detalhe.totalRelatos > 0 && (
        <LinkSeta href={hrefs.relatos} scroll={false} className="text-sm">
          Ver {detalhe.totalRelatos === 1 ? "o relato" : `os ${detalhe.totalRelatos} relatos`}
        </LinkSeta>
      )}

      {/* Algo errado com o lugar: nome, local, fechou, repetido */}
      <div className="-ml-3 flex flex-wrap gap-1 border-t border-borda pt-3">
        {podeEditar && (
          <Link href={`/lugar/${lugar.id}/editar`} className="botao-terciario">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              {/* Lápis */}
              <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
            </svg>
            <TextoAoCarregar>Corrigir lugar</TextoAoCarregar>
          </Link>
        )}
        <Link href={`/lugar/${lugar.id}/problema`} className="botao-terciario">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            {/* Bandeira */}
            <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
          </svg>
          <TextoAoCarregar>Informar um problema</TextoAoCarregar>
        </Link>
      </div>
    </article>
  );
}
