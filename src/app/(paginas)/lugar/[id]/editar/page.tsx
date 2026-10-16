import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LinkSeta } from "@/components/LinkSeta";
import { apagarLugar, editarLugar, podeEditarLugar } from "@/lib/acoes/lugares";
import type { Categoria } from "@/lib/estimulos";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { usuarioAtualId } from "@/lib/supabase/server";
import { FormLugar } from "../../novo/FormLugar";

export const metadata: Metadata = { title: "Corrigir lugar", robots: { index: false } };

/** Corrigir ou apagar um lugar: quem adicionou (sem relatos de outras pessoas) ou a moderação. */
export default async function PaginaEditarLugar(props: PageProps<"/lugar/[id]/editar">) {
  const { id } = await props.params;
  if (!(await usuarioAtualId())) redirect(`/entrar?voltar=${encodeURIComponent(`/lugar/${id}/editar`)}`);
  if (!(await podeEditarLugar(id))) redirect(`/?lugar=${id}`);
  // Chave secreta: a moderação também corrige lugares ocultos ou arquivados.
  const { data: lugar } = await criarClienteAdmin()
    .from("lugares")
    .select("id, nome, categoria, endereco, bairro, lat, lng")
    .eq("id", id)
    .maybeSingle();
  if (!lugar) notFound();
  const voltar = `/?lugar=${id}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <LinkSeta href={voltar} voltar className="text-sm">
        Voltar para {lugar.nome}
      </LinkSeta>
      <h1 className="text-2xl">Corrigir lugar</h1>
      <FormLugar
        acao={editarLugar.bind(null, id)}
        inicial={{ ...lugar, categoria: lugar.categoria as Categoria }}
        textoBotao="Salvar correção"
      />
      <section aria-labelledby="titulo-apagar-lugar" className="space-y-3 border-t border-borda pt-6">
        <h2 id="titulo-apagar-lugar" className="text-xl">
          Apagar lugar
        </h2>
        <p className="text-sm">
          Use se o lugar foi adicionado por engano. Os relatos dele também são apagados. Não dá para
          desfazer.
        </p>
        <details>
          <summary className="botao botao-perigo cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            Apagar este lugar
          </summary>
          <form action={apagarLugar.bind(null, id)} className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm font-bold">Tem certeza?</p>
            <button type="submit" className="botao botao-perigo">
              Sim, apagar
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}
