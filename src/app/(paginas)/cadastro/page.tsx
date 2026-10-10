import type { Metadata } from "next";
import { ComposicaoRostos } from "@/components/ComposicaoRostos";
import { LinkSeta } from "@/components/LinkSeta";
import { primeiro } from "@/lib/parametros";
import { FormCadastro } from "./FormCadastro";

export const metadata: Metadata = { title: "Criar conta" };

export default async function PaginaCadastro(props: PageProps<"/cadastro">) {
  const voltar = primeiro((await props.searchParams).voltar) || "/";
  return (
    <div className="grid items-start gap-4 md:grid-cols-2 md:gap-6">
      {/* No computador, a composição fica parada ao lado enquanto o formulário rola */}
      <div className="md:sticky md:top-24 md:order-last md:h-[calc(100dvh-8rem)]">
        <ComposicaoRostos titulo="Boas-vindas!">
          <p>
            Saber antes como é o barulho, a luz, os cheiros e o movimento de um lugar ajuda muita
            gente a ir com mais tranquilidade. Previsibilidade sensorial faz diferença,
            principalmente para pessoas autistas.
          </p>
          <p className="mt-2">
            Com a sua conta, você conta como é lá, guarda seu perfil sensorial e encontra primeiro
            os lugares mais confortáveis para você.
          </p>
        </ComposicaoRostos>
      </div>

      <div className="cartao space-y-4 p-6 md:p-8">
        <h1 className="display text-3xl">Criar conta</h1>
        <p className="text-sm">
          Pedimos só o necessário: nome, nome público e e-mail. O perfil sensorial é opcional e só
          fica guardado com a sua autorização. Não tem senha: a gente manda um código para o seu
          e-mail.
        </p>
        <FormCadastro voltar={voltar} />
        <div className="flex flex-wrap items-center gap-x-2 border-t border-borda pt-4 text-sm">
          <span className="text-texto-suave">Já tem conta?</span>
          <LinkSeta href={`/entrar?voltar=${encodeURIComponent(voltar)}`}>Entrar</LinkSeta>
        </div>
      </div>
    </div>
  );
}
