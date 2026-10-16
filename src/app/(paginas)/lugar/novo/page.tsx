import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtualId } from "@/lib/supabase/server";
import { criarLugar } from "@/lib/acoes/lugares";
import { FormLugar } from "./FormLugar";
import { VoltarAoMapa } from "@/components/LinkSeta";

export const metadata: Metadata = { title: "Adicionar lugar" };

export default async function PaginaNovoLugar() {
  if (!(await usuarioAtualId())) redirect("/entrar?voltar=/lugar/novo");
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <VoltarAoMapa />
      <h1 className="text-2xl">Adicionar lugar</h1>
      <p>
        Antes, <Link href="/">busque pelo nome</Link> para ver se o lugar já existe. Vale qualquer
        lugar do Brasil: marque no mapa e a cidade é preenchida sozinha.
      </p>
      <FormLugar acao={criarLugar} />
    </div>
  );
}
