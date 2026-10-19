"use server";

import { redirect } from "next/navigation";
import { HORA_DO_PERIODO, MAXIMO_POR_ENVIO, type LinhaAvaliacao } from "@/lib/avaliacoes";
import { ESTIMULOS } from "@/lib/estimulos";
import { hojeEmPortoAlegre } from "@/lib/formato";
import { garantirLugarDoOsm } from "@/lib/lugaresOsm";
import { criarClienteServidor, usuarioAtualId } from "@/lib/supabase/server";

export type ResultadoLinha = { ok: true } | { ok: false; erro: string };

const NIVEL = new Set(["", "0", "1", "2"]);

/**
 * Salva avaliações de vários lugares de uma vez (relatos sem texto, da conta de quem envia).
 * Cada linha é gravada separadamente: as que derem certo ficam salvas mesmo se outras falharem.
 * Os limites do banco valem para cada uma (um por lugar por dia, até 100 por dia).
 */
export async function salvarAvaliacoes(linhas: LinhaAvaliacao[]): Promise<ResultadoLinha[]> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect("/entrar?voltar=/avaliar");
  if (!Array.isArray(linhas)) return [];
  const supabase = await criarClienteServidor();
  const hoje = hojeEmPortoAlegre();
  const resultados: ResultadoLinha[] = [];

  for (const [i, l] of linhas.slice(0, MAXIMO_POR_ENVIO).entries()) {
    // Confere tudo de novo no servidor: o que vem do navegador não é confiável.
    if (!l || typeof l.ref !== "string" || !l.niveis) {
      resultados[i] = { ok: false, erro: "Linha inválida." };
      continue;
    }
    if (!ESTIMULOS.every((e) => NIVEL.has(l.niveis[e] ?? ""))) {
      resultados[i] = { ok: false, erro: "Nível inválido." };
      continue;
    }
    if (ESTIMULOS.every((e) => !l.niveis[e])) {
      resultados[i] = { ok: false, erro: "Marque como estava pelo menos um estímulo." };
      continue;
    }
    const sempre = l.quando === "sempre";
    if (!sempre && !(l.quando in HORA_DO_PERIODO)) {
      resultados[i] = { ok: false, erro: "Diga quando você foi." };
      continue;
    }
    if (!sempre && (!/^\d{4}-\d{2}-\d{2}$/.test(l.data) || l.data > hoje || l.data < "2000-01-01")) {
      resultados[i] = { ok: false, erro: "Confira a data (não pode ser no futuro)." };
      continue;
    }

    // Lugar: já na base (id) ou do OpenStreetMap (gravado agora).
    let lugarId: string | null = null;
    if (l.ref.startsWith("id:") && /^[0-9a-f-]{36}$/i.test(l.ref.slice(3))) {
      const { data } = await supabase.from("lugares").select("id").eq("id", l.ref.slice(3)).maybeSingle();
      lugarId = data?.id ?? null;
    } else if (l.ref.startsWith("osm:")) {
      lugarId = await garantirLugarDoOsm(l.ref.slice(4));
    }
    if (!lugarId) {
      resultados[i] = { ok: false, erro: "Escolha o lugar na lista de sugestões." };
      continue;
    }

    const { error } = await supabase.from("relatos").insert({
      lugar_id: lugarId,
      usuario_id: usuarioId,
      ...Object.fromEntries(ESTIMULOS.map((e) => [e, l.niveis[e] === "" ? null : Number(l.niveis[e])])),
      sempre_assim: sempre,
      data: sempre ? null : l.data,
      hora: sempre ? null : HORA_DO_PERIODO[l.quando as keyof typeof HORA_DO_PERIODO],
      o_que_esperar: null,
      comentario: null,
    });
    if (!error) resultados[i] = { ok: true };
    else if (error.message.includes("limite_lugar_dia"))
      resultados[i] = { ok: false, erro: "Você já avaliou este lugar hoje." };
    else if (error.message.includes("limite_relatos_dia"))
      resultados[i] = { ok: false, erro: "Limite de 100 avaliações por dia. Tente amanhã." };
    else {
      console.error(error);
      resultados[i] = { ok: false, erro: "Não foi possível salvar esta linha." };
    }
  }
  return resultados;
}
