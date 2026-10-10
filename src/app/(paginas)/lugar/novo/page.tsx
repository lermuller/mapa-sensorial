import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { usuarioAtualId } from "@/lib/supabase/server";
import { FormLugar } from "./FormLugar";

export const metadata: Metadata = { title: "Adicionar lugar" };

export default async function PaginaNovoLugar() {
  if (!(await usuarioAtualId())) redirect("/entrar?voltar=/lugar/novo");
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl">Adicionar lugar</h1>
      <p>
        Antes, <Link href="/">busque pelo nome</Link> para ver se o lugar já existe. Por enquanto,
        só lugares de Porto Alegre.
      </p>
      <FormLugar />
    </div>
  );
}
