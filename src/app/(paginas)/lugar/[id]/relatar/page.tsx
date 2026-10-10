import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormRelato } from "@/components/FormRelato";
import { criarRelato } from "@/lib/acoes/relatos";
import { obterLugar } from "@/lib/dados";
import { hojeEmPortoAlegre } from "@/lib/formato";
import { usuarioAtualId } from "@/lib/supabase/server";
import { LinkSeta } from "@/components/LinkSeta";

export const metadata: Metadata = { title: "Contar como é lá" };

export default async function PaginaRelatar(props: PageProps<"/lugar/[id]/relatar">) {
  const { id } = await props.params;
  const lugar = await obterLugar(id);
  if (!lugar) notFound();
  if (!(await usuarioAtualId())) redirect(`/entrar?voltar=/lugar/${id}/relatar`);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <p className="ajuda">
        <LinkSeta href={`/lugar/${id}`} voltar>Voltar para {lugar.nome}</LinkSeta>
      </p>
      <h1 className="display text-3xl">Como é lá: {lugar.nome}</h1>
      <p>Conta pra gente como estava. O relato fala do lugar, não de você.</p>
      <FormRelato
        acao={criarRelato.bind(null, id)}
        hoje={hojeEmPortoAlegre()}
        textoBotao="Publicar meu relato"
      />
    </div>
  );
}
