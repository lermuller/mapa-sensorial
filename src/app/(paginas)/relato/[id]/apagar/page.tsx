import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { apagarRelato } from "@/lib/acoes/relatos";
import { obterLugar, obterRelato } from "@/lib/dados";
import { formatarData } from "@/lib/formato";
import { usuarioAtualId } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Apagar relato" };

export default async function PaginaApagarRelato(props: PageProps<"/relato/[id]/apagar">) {
  const { id } = await props.params;
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect(`/entrar?voltar=/relato/${id}/apagar`);
  const relato = await obterRelato(id);
  if (!relato || relato.usuario_id !== usuarioId) notFound();
  const lugar = await obterLugar(relato.lugar_id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl">Apagar relato</h1>
      <p>
        Você vai apagar o seu relato sobre <strong>{lugar?.nome}</strong>, feito em{" "}
        {formatarData(relato.criado_em)}. Não dá para desfazer.
      </p>
      <form action={apagarRelato.bind(null, id)} className="flex flex-wrap gap-3">
        <button type="submit" className="botao botao-perigo">
          Apagar relato
        </button>
        <Link href={`/?lugar=${relato.lugar_id}&painel=relatos`} className="botao botao-secundario">
          Cancelar
        </Link>
      </form>
    </div>
  );
}
