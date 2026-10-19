import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VoltarAoMapa } from "@/components/LinkSeta";
import { TabelaAvaliacoes } from "@/components/avaliar/TabelaAvaliacoes";
import { hojeEmPortoAlegre } from "@/lib/formato";
import { usuarioAtualId } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Avaliar vários lugares", robots: { index: false } };

/** Avaliar vários lugares de uma vez (só os níveis, sem texto). Exige conta. */
export default async function PaginaAvaliar() {
  if (!(await usuarioAtualId())) redirect("/entrar?voltar=/avaliar");
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <VoltarAoMapa />
      <header className="space-y-2">
        <h1 className="display text-4xl">Avaliar vários lugares</h1>
        <p>
          Já foi a vários lugares? Avalie todos de uma vez: escolha o lugar, marque como estavam os
          estímulos e diga quando foi. Cada linha vira uma avaliação sua, como um relato sem texto.
        </p>
      </header>
      <TabelaAvaliacoes hoje={hojeEmPortoAlegre()} />
    </div>
  );
}
