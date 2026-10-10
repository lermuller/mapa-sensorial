import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { denunciarRelato } from "@/lib/acoes/relatos";
import { obterRelato } from "@/lib/dados";
import { usuarioAtualId } from "@/lib/supabase/server";
import { FormDenuncia } from "./FormDenuncia";
import { LinkSeta } from "@/components/LinkSeta";

export const metadata: Metadata = { title: "Denunciar relato" };

export default async function PaginaDenunciar(props: PageProps<"/relato/[id]/denunciar">) {
  const { id } = await props.params;
  if (!(await usuarioAtualId())) redirect(`/entrar?voltar=/relato/${id}/denunciar`);
  const relato = await obterRelato(id);
  if (!relato) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <p className="ajuda">
        <LinkSeta href={`/?lugar=${relato.lugar_id}&painel=relatos`} voltar>Voltar para os relatos</LinkSeta>
      </p>
      <h1 className="text-2xl">Denunciar relato</h1>
      <p>
        Denuncie relatos ofensivos, falsos, com dados pessoais ou que falem de pessoas em vez do
        lugar. Uma pessoa da equipe vai ler e decidir.
      </p>
      <FormDenuncia acao={denunciarRelato.bind(null, id)} voltar={`/?lugar=${relato.lugar_id}&painel=relatos`} />
    </div>
  );
}
