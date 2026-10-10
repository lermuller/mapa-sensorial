"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor, usuarioAtualId } from "@/lib/supabase/server";

/** A pessoa logada está na tabela de moderadores. */
export async function ehModeradora(): Promise<boolean> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) return false;
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("moderadores")
    .select("usuario_id")
    .eq("usuario_id", usuarioId)
    .maybeSingle();
  return !!data;
}

async function exigirModeradora() {
  if (!(await ehModeradora())) redirect("/");
}

/** Mantém o relato: encerra as denúncias e devolve ao ar. */
export async function manterRelato(relatoId: string): Promise<void> {
  await exigirModeradora();
  const admin = criarClienteAdmin();
  await admin.from("denuncias").update({ resolvida: true }).eq("relato_id", relatoId);
  await admin.from("relatos").update({ oculto: false }).eq("id", relatoId);
  revalidatePath("/moderacao");
}

/** Remove o relato (as denúncias vão junto). */
export async function removerRelato(relatoId: string): Promise<void> {
  await exigirModeradora();
  await criarClienteAdmin().from("relatos").delete().eq("id", relatoId);
  revalidatePath("/moderacao");
}
