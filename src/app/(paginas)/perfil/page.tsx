import type { Metadata } from "next";
import Link from "next/link";
import { obterPerfil } from "@/lib/dados";
import { primeiro } from "@/lib/parametros";
import { usuarioAtualId } from "@/lib/supabase/server";
import { FormPerfil } from "./FormPerfil";
import { VoltarAoMapa } from "@/components/LinkSeta";

export const metadata: Metadata = { title: "Meu perfil sensorial" };

export default async function PaginaPerfil(props: PageProps<"/perfil">) {
  const sp = await props.searchParams;
  const usuarioId = await usuarioAtualId();
  const perfil = usuarioId ? await obterPerfil(usuarioId) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <VoltarAoMapa />
      <h1 className="text-2xl">Meu perfil sensorial</h1>
      <p>
        Marque os estímulos que mais afetam você. Quando o perfil está ativo na busca, os lugares
        mais confortáveis para ele aparecem primeiro, e o melhor horário de cada lugar é calculado
        para esses estímulos.
      </p>

      {primeiro(sp.apagado) === "1" && (
        <p className="sucesso" role="status">
          Seu perfil sensorial foi apagado da sua conta.
        </p>
      )}

      {perfil === null ? (
        <div className="cartao space-y-3">
          <p>
            O perfil fica guardado na sua conta, só com a sua autorização. Para montar, crie uma
            conta ou entre. Sem conta, você ainda pode usar os filtros de sensibilidade na busca.
          </p>
          <div className="flex flex-wrap justify-end gap-2">
            <Link href="/entrar?voltar=/perfil" className="botao botao-secundario">
              Entrar
            </Link>
            <Link href="/cadastro?voltar=/perfil" className="botao">
              Criar conta
            </Link>
          </div>
        </div>
      ) : (
        <FormPerfil perfil={perfil} />
      )}
    </div>
  );
}
