import type { ReactNode } from "react";
import { LinkSeta } from "@/components/LinkSeta";
import { env } from "@/lib/env";
import { VIGENCIA } from "@/lib/legal";

/** Página de documento (privacidade, termos): título, vigência, índice e seções numeradas. */
export function DocumentoLegal({
  titulo,
  resumo,
  secoes,
  children,
}: {
  titulo: string;
  /** "Em poucas palavras": o essencial antes do texto completo. */
  resumo: ReactNode;
  secoes: { id: string; rotulo: string }[];
  children: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-2xl space-y-10">
      <header className="space-y-4">
        <LinkSeta href="/" voltar className="text-sm">
          Voltar para o mapa
        </LinkSeta>
        <div className="space-y-2">
          <h1 className="display text-4xl">{titulo}</h1>
          <p className="text-sm text-texto-suave">Em vigor desde {VIGENCIA}.</p>
        </div>
        <div className="rounded-3xl bg-destaque-suave p-5" style={{ border: "var(--linha) solid var(--borda)" }}>
          <h2 className="mb-2 text-lg">Em poucas palavras</h2>
          <div className="space-y-2 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{resumo}</div>
        </div>
        <nav aria-label="Nesta página">
          <ol className="list-inside list-decimal space-y-1 text-sm">
            {secoes.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.rotulo}</a>
              </li>
            ))}
          </ol>
        </nav>
      </header>
      {children}
    </article>
  );
}

/** Seção numerada de um documento. Listas e tabelas dentro dela já vêm formatadas. */
export function SecaoLegal({
  id,
  numero,
  titulo,
  children,
}: {
  id: string;
  numero: number;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`titulo-${id}`}
      className="scroll-mt-24 space-y-3 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5"
    >
      <h2 id={`titulo-${id}`} className="text-2xl">
        {numero}. {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Canal de contato: o e-mail do projeto, ou um aviso enquanto ele não está configurado. */
export function EmailContato() {
  return env.emailContato ? (
    <a href={`mailto:${env.emailContato}`}>{env.emailContato}</a>
  ) : (
    <strong>[e-mail de contato a definir]</strong>
  );
}
