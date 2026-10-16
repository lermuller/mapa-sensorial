import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LinkSeta } from "@/components/LinkSeta";
import { informarProblema } from "@/lib/acoes/lugares";
import { obterLugar } from "@/lib/dados";
import { usuarioAtualId } from "@/lib/supabase/server";
import { FormProblema } from "./FormProblema";

export const metadata: Metadata = { title: "Informar um problema", robots: { index: false } };

export default async function PaginaProblema(props: PageProps<"/lugar/[id]/problema">) {
  const { id } = await props.params;
  if (!(await usuarioAtualId())) redirect(`/entrar?voltar=${encodeURIComponent(`/lugar/${id}/problema`)}`);
  const lugar = await obterLugar(id);
  if (!lugar) notFound();
  const voltar = `/?lugar=${id}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <LinkSeta href={voltar} voltar className="text-sm">
        Voltar para {lugar.nome}
      </LinkSeta>
      <h1 className="text-2xl">Informar um problema</h1>
      <p>
        Algo errado com <strong>{lugar.nome}</strong>? Conte para a moderação. Se 3 pessoas disserem
        que o lugar fechou, ele ganha o aviso “Pode ter fechado”. Nomes ofensivos ou propaganda
        saem do ar com o aviso de 2 pessoas, até a revisão.
      </p>
      <FormProblema acao={informarProblema.bind(null, id)} voltar={voltar} />
    </div>
  );
}
