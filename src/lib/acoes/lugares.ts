"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ehModeradora } from "@/lib/acoes/moderacao";
import type { EstadoForm } from "@/lib/acoes/relatos";
import { normalizar } from "@/lib/busca";
import { CATEGORIAS } from "@/lib/estimulos";
import { enderecoDoPonto } from "@/lib/externo";
import { mensagemDoProblema, problemaNoTexto } from "@/lib/moderacao";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor, usuarioAtualId } from "@/lib/supabase/server";

// Lugares adicionados pelas pessoas: criar, corrigir, apagar e informar problemas.

const textoOpcional = (max: number) =>
  z
    .string()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((v) => v.trim() || null);

const esquemaLugar = z.object({
  nome: z.string().trim().min(1, "Digite o nome do lugar.").max(200),
  categoria: z.enum(CATEGORIAS, { message: "Escolha o tipo de lugar." }),
  endereco: textoOpcional(300),
  bairro: textoOpcional(100),
  // Retângulo do Brasil; cidade e estado vêm do ponto marcado (enderecoDoPonto).
  lat: z.coerce.number({ message: "Marque o local no mapa." }).min(-34).max(6),
  lng: z.coerce.number({ message: "Marque o local no mapa." }).min(-74).max(-34),
});

/** Lê e confere o formulário do lugar (criar e corrigir). */
function lerLugar(form: FormData): { dados: z.infer<typeof esquemaLugar> } | { erro: string } {
  const campo = (n: string) => String(form.get(n) ?? "");
  if (!campo("lat") || !campo("lng")) return { erro: "Marque o local no mapa." };
  const r = esquemaLugar.safeParse({
    nome: campo("nome"),
    categoria: campo("categoria"),
    endereco: campo("endereco"),
    bairro: campo("bairro"),
    lat: campo("lat"),
    lng: campo("lng"),
  });
  if (!r.success) {
    const problema = r.error.issues[0];
    if (problema?.path[0] === "lat" || problema?.path[0] === "lng") {
      return { erro: "O local marcado fica fora do Brasil. Por enquanto, só aceitamos lugares do Brasil." };
    }
    return { erro: problema?.message ?? "Confira os campos." };
  }
  // Mesmo filtro dos relatos: nada de ofensas, contatos ou links no nome e no endereço.
  for (const texto of [r.data.nome, r.data.endereco, r.data.bairro]) {
    const p = problemaNoTexto(texto);
    if (p) return { erro: mensagemDoProblema(p) };
  }
  return { dados: r.data };
}

/** Retângulo de ~150 m em volta de um ponto (para procurar lugares repetidos). */
function perto(lat: number, lng: number, metros = 150) {
  const dLat = metros / 111_000;
  const dLng = metros / (111_000 * Math.cos((lat * Math.PI) / 180));
  return { sul: lat - dLat, norte: lat + dLat, oeste: lng - dLng, leste: lng + dLng };
}

export async function criarLugar(_anterior: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect("/entrar?voltar=/lugar/novo");
  const lido = lerLugar(form);
  if ("erro" in lido) return { erro: lido.erro };
  const dados = lido.dados;

  const supabase = await criarClienteServidor();
  // Repetido: mesmo nome a menos de ~150 m. O aviso na tela já mostra os próximos;
  // aqui só barra o caso certo de duplicado.
  const a = perto(dados.lat, dados.lng);
  const { data: proximos } = await supabase
    .from("lugares")
    .select("id, nome")
    .gte("lat", a.sul)
    .lte("lat", a.norte)
    .gte("lng", a.oeste)
    .lte("lng", a.leste);
  const igual = (proximos ?? []).find((l) => normalizar(l.nome) === normalizar(dados.nome));
  if (igual) {
    return { erro: `“${igual.nome}” já está no mapa, bem perto daqui. Abra o lugar que já existe para contar como é lá.` };
  }

  // Cidade, estado e (se a pessoa não informou) bairro do ponto marcado. Se o serviço não
  // responder, o lugar é criado sem eles.
  const local = await enderecoDoPonto(dados.lat, dados.lng);
  const { data, error } = await supabase
    .from("lugares")
    .insert({
      ...dados,
      bairro: dados.bairro ?? local?.bairro ?? null,
      cidade: local?.cidade ?? null,
      uf: local?.uf ?? null,
      origem: "usuario",
      criado_por: usuarioId,
    })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.message.includes("limite_lugares_dia")) {
      return { erro: "Você já adicionou 5 lugares hoje. Amanhã dá para adicionar mais." };
    }
    console.error(error);
    return { erro: "Não foi possível adicionar o lugar. Tente de novo." };
  }
  redirect(`/?lugar=${data.id}`);
}

/**
 * Quem pode corrigir ou apagar o lugar: a moderação sempre; quem adicionou, enquanto o lugar
 * não tiver relatos de outras pessoas (depois disso, o lugar é da comunidade).
 */
export async function podeEditarLugar(lugarId: string): Promise<boolean> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) return false;
  if (await ehModeradora()) return true;
  const admin = criarClienteAdmin();
  const { data: lugar } = await admin
    .from("lugares")
    .select("criado_por, origem")
    .eq("id", lugarId)
    .maybeSingle();
  if (!lugar || lugar.origem !== "usuario" || lugar.criado_por !== usuarioId) return false;
  const { count } = await admin
    .from("relatos")
    .select("id", { count: "exact", head: true })
    .eq("lugar_id", lugarId)
    .neq("usuario_id", usuarioId);
  return (count ?? 0) === 0;
}

export async function editarLugar(lugarId: string, _anterior: EstadoForm, form: FormData): Promise<EstadoForm> {
  if (!(await podeEditarLugar(lugarId))) redirect(`/?lugar=${lugarId}`);
  const lido = lerLugar(form);
  if ("erro" in lido) return { erro: lido.erro };
  const local = await enderecoDoPonto(lido.dados.lat, lido.dados.lng);
  const { error } = await criarClienteAdmin()
    .from("lugares")
    .update({
      ...lido.dados,
      bairro: lido.dados.bairro ?? local?.bairro ?? null,
      cidade: local?.cidade ?? null,
      uf: local?.uf ?? null,
    })
    .eq("id", lugarId);
  if (error) {
    console.error(error);
    return { erro: "Não foi possível salvar. Tente de novo." };
  }
  revalidatePath("/");
  redirect(`/?lugar=${lugarId}`);
}

export async function apagarLugar(lugarId: string): Promise<void> {
  if (!(await podeEditarLugar(lugarId))) redirect(`/?lugar=${lugarId}`);
  await criarClienteAdmin().from("lugares").delete().eq("id", lugarId);
  revalidatePath("/");
  redirect("/");
}

const MOTIVOS = ["nao_existe", "local_errado", "nome_errado", "duplicado", "ofensivo", "outro"] as const;

export async function informarProblema(
  lugarId: string,
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect(`/entrar?voltar=${encodeURIComponent(`/lugar/${lugarId}/problema`)}`);
  const motivo = String(form.get("motivo") ?? "");
  if (!(MOTIVOS as readonly string[]).includes(motivo)) return { erro: "Escolha qual é o problema." };
  const detalhe = String(form.get("detalhe") ?? "").trim().slice(0, 1000) || null;
  if ((motivo === "outro" || motivo === "duplicado") && !detalhe) {
    return {
      erro: motivo === "duplicado" ? "Diga qual é o outro lugar igual a este." : "Conte qual é o problema.",
    };
  }
  const p = problemaNoTexto(detalhe);
  if (p && p !== "link") return { erro: mensagemDoProblema(p) };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("problemas_lugares")
    .insert({ lugar_id: lugarId, denunciante_id: usuarioId, motivo, detalhe });
  if (error) {
    if (error.code === "23505") return { erro: "Você já informou esse problema neste lugar. Obrigado!" };
    console.error(error);
    return { erro: "Não foi possível enviar. Tente de novo." };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Moderação

async function exigirModeradora() {
  if (!(await ehModeradora())) redirect("/");
}

/** Mantém o lugar como está: encerra os problemas e tira avisos e ocultação. */
export async function manterLugar(lugarId: string): Promise<void> {
  await exigirModeradora();
  const admin = criarClienteAdmin();
  await admin.from("problemas_lugares").update({ resolvido: true }).eq("lugar_id", lugarId);
  await admin.from("lugares").update({ oculto: false, talvez_fechado: false }).eq("id", lugarId);
  revalidatePath("/moderacao");
}

/** Arquiva o lugar (fechou, não existe, duplicado ou ofensivo): some do mapa sem ser apagado. */
export async function arquivarLugar(lugarId: string): Promise<void> {
  await exigirModeradora();
  const admin = criarClienteAdmin();
  await admin.from("problemas_lugares").update({ resolvido: true }).eq("lugar_id", lugarId);
  await admin.from("lugares").update({ arquivado: true }).eq("id", lugarId);
  revalidatePath("/moderacao");
}

/** Desfaz o arquivamento. */
export async function desarquivarLugar(lugarId: string): Promise<void> {
  await exigirModeradora();
  await criarClienteAdmin().from("lugares").update({ arquivado: false, oculto: false }).eq("id", lugarId);
  revalidatePath("/moderacao");
}
