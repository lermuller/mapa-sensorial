"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ESTIMULOS } from "@/lib/estimulos";
import { hojeEmPortoAlegre } from "@/lib/formato";
import { mensagemDoProblema, problemaNoTexto } from "@/lib/moderacao";
import { criarClienteServidor, usuarioAtualId } from "@/lib/supabase/server";

export type EstadoForm = { erro?: string; ok?: boolean };

const intensidade = z
  .enum(["", "0", "1", "2"])
  .transform((v) => (v === "" ? null : Number(v)));

const textoOpcional = (max: number) =>
  z
    .string()
    .max(max, `Use no máximo ${max} caracteres.`)
    .transform((v) => v.trim() || null);

const esquemaRelato = z
  .object({
    som: intensidade,
    luz: intensidade,
    cheiro: intensidade,
    lotacao: intensidade,
    visual: intensidade,
    temperatura: intensidade,
    quando: z.enum(["sempre", "data"], { message: "Falta dizer quando você foi." }),
    data: z.string(),
    hora: z.string(),
    o_que_esperar: textoOpcional(1000),
    comentario: textoOpcional(2000),
  })
  .superRefine((v, ctx) => {
    if (ESTIMULOS.every((e) => v[e] === null)) {
      ctx.addIssue({
        code: "custom",
        message: "Falta dizer como estava pelo menos um estímulo.",
      });
    }
    if (v.quando === "data") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v.data) || !/^\d{2}:\d{2}/.test(v.hora)) {
        ctx.addIssue({ code: "custom", message: "Falta dizer quando você foi." });
      } else if (v.data > hojeEmPortoAlegre()) {
        ctx.addIssue({ code: "custom", message: "A data não pode estar no futuro." });
      }
    }
  });

function lerRelato(form: FormData) {
  const campo = (n: string) => String(form.get(n) ?? "");
  const r = esquemaRelato.safeParse({
    ...Object.fromEntries(ESTIMULOS.map((e) => [e, campo(e)])),
    quando: campo("quando"),
    data: campo("data"),
    hora: campo("hora"),
    o_que_esperar: campo("o_que_esperar"),
    comentario: campo("comentario"),
  });
  if (!r.success) return { erro: r.error.issues[0]?.message ?? "Confira os campos." } as const;
  const v = r.data;
  // Textos públicos: sem dados pessoais, links nem ofensas.
  const problema = problemaNoTexto(v.o_que_esperar) ?? problemaNoTexto(v.comentario);
  if (problema) return { erro: mensagemDoProblema(problema) } as const;
  const sempre = v.quando === "sempre";
  return {
    dados: {
      ...Object.fromEntries(ESTIMULOS.map((e) => [e, v[e]])),
      sempre_assim: sempre,
      data: sempre ? null : v.data,
      hora: sempre ? null : v.hora.slice(0, 5),
      o_que_esperar: v.o_que_esperar,
      comentario: v.comentario,
    },
  } as const;
}

export async function criarRelato(
  lugarId: string,
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) {
    redirect(`/entrar?voltar=${encodeURIComponent(`/?lugar=${lugarId}&painel=relatar`)}`);
  }
  const r = lerRelato(form);
  if ("erro" in r) return { erro: r.erro };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("relatos")
    .insert({ ...r.dados, lugar_id: lugarId, usuario_id: usuarioId });
  if (error) {
    // Limites do banco (migração moderacao).
    if (error.message.includes("limite_lugar_dia")) {
      return { erro: "Você já contou como é este lugar hoje. Amanhã dá para contar de novo." };
    }
    if (error.message.includes("limite_relatos_dia")) {
      return { erro: "Você chegou ao limite de 100 avaliações por dia. Obrigado por ajudar tanto!" };
    }
    console.error(error);
    return { erro: "Não deu para salvar seu relato agora. Tenta de novo?" };
  }
  // Volta para o lugar no painel sobre o mapa.
  redirect(`/?lugar=${lugarId}&enviado=1`);
}

export async function editarRelato(
  relatoId: string,
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect(`/entrar?voltar=/relato/${relatoId}/editar`);
  const r = lerRelato(form);
  if ("erro" in r) return { erro: r.erro };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("relatos")
    .update(r.dados)
    .eq("id", relatoId)
    .eq("usuario_id", usuarioId)
    .select("lugar_id")
    .maybeSingle();
  if (error || !data) {
    console.error(error);
    return { erro: "Não foi possível salvar as mudanças. Tente de novo." };
  }
  redirect(`/?lugar=${data.lugar_id}&painel=relatos`);
}

export async function apagarRelato(relatoId: string): Promise<void> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect("/entrar");
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("relatos")
    .delete()
    .eq("id", relatoId)
    .eq("usuario_id", usuarioId)
    .select("lugar_id")
    .maybeSingle();
  redirect(data ? `/?lugar=${data.lugar_id}&painel=relatos` : "/conta");
}

const esquemaDenuncia = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, "Conte o motivo da denúncia.")
    .max(1000, "Use no máximo 1000 caracteres."),
});

export async function denunciarRelato(
  relatoId: string,
  _anterior: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect(`/entrar?voltar=/relato/${relatoId}/denunciar`);
  const r = esquemaDenuncia.safeParse({ motivo: String(form.get("motivo") ?? "") });
  if (!r.success) return { erro: r.error.issues[0]?.message };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("denuncias")
    .insert({ relato_id: relatoId, denunciante_id: usuarioId, motivo: r.data.motivo });
  // 23505: a pessoa já denunciou este relato. Tratamos como sucesso.
  if (error && error.code !== "23505") {
    console.error(error);
    return { erro: "Não foi possível enviar a denúncia. Tente de novo." };
  }
  return { ok: true };
}

