import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormRelato } from "@/components/FormRelato";
import { editarRelato } from "@/lib/acoes/relatos";
import { obterLugar, obterRelato } from "@/lib/dados";
import { hojeEmPortoAlegre } from "@/lib/formato";
import { usuarioAtualId } from "@/lib/supabase/server";
import { LinkSeta } from "@/components/LinkSeta";

export const metadata: Metadata = { title: "Editar relato" };

export default async function PaginaEditarRelato(props: PageProps<"/relato/[id]/editar">) {
  const { id } = await props.params;
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect(`/entrar?voltar=/relato/${id}/editar`);
  const relato = await obterRelato(id);
  if (!relato || relato.usuario_id !== usuarioId) notFound();
  const lugar = await obterLugar(relato.lugar_id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <p className="ajuda">
        <LinkSeta href={`/?lugar=${relato.lugar_id}&painel=relatos`} voltar>Voltar para {lugar?.nome}</LinkSeta>
      </p>
      <h1 className="text-2xl">Editar relato: {lugar?.nome}</h1>
      <FormRelato
        acao={editarRelato.bind(null, id)}
        inicial={relato}
        hoje={hojeEmPortoAlegre()}
        textoBotao="Salvar mudanças"
      />
    </div>
  );
}
