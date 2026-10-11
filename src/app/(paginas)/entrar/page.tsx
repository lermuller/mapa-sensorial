import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ComposicaoRostos } from "@/components/ComposicaoRostos";
import { LinkSeta, VoltarAoMapa } from "@/components/LinkSeta";
import { primeiro } from "@/lib/parametros";
import { usuarioAtualId } from "@/lib/supabase/server";
import { FormEntrar } from "./FormEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaEntrar(props: PageProps<"/entrar">) {
  const sp = await props.searchParams;
  const voltar = primeiro(sp.voltar) || "/";
  if (await usuarioAtualId()) redirect(voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/");

  return (
    <div className="space-y-4">
      <VoltarAoMapa />
      <div className="grid items-stretch gap-4 md:grid-cols-2 md:gap-6">
        <div className="md:order-last">
          <ComposicaoRostos titulo="Que bom te ver de novo.">
            Quem já foi conta como é lá, e a gente se prepara junto.
          </ComposicaoRostos>
        </div>
  
        <div className="cartao flex flex-col justify-center space-y-4 p-6 md:p-8">
          <h1 className="display text-3xl">Entrar</h1>
          {primeiro(sp.erro) === "link" && (
            <p className="erro">
              Esse link expirou ou já foi usado. Peça um código abaixo: ele funciona em qualquer navegador.
            </p>
          )}
          <p className="text-sm">
            A conta serve para contar como é lá e guardar seu perfil sensorial. Não tem senha: a
            gente manda um código para o seu e-mail.
          </p>
          <FormEntrar voltar={voltar} />
          <div className="flex flex-wrap items-center gap-x-2 border-t border-borda pt-4 text-sm">
            <span className="text-texto-suave">Ainda não tem conta?</span>
            <LinkSeta href={`/cadastro?voltar=${encodeURIComponent(voltar)}`}>Criar conta</LinkSeta>
          </div>
        </div>
      </div>
    </div>
  );
}
