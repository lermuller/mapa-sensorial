import "server-only";
import type { Categoria, Estimulo, Intensidade } from "./estimulos";
import { ESTIMULOS } from "./estimulos";
import type { RelatoEstatistica } from "./estatisticas";
import { diaEmSaoPaulo, ultimasSemanas } from "./semanas";
import { criarClienteAdmin } from "./supabase/admin";

// Leitura dos dados para /dados (público, agregado) e /metricas (interno, só moderação).
// Lê com a chave secreta, mas só os campos necessários: nada de textos, nomes ou perfis.

type LinhaRelato = Record<Estimulo, Intensidade | null> & {
  lugar_id: string;
  sempre_assim: boolean;
  data: string | null;
  hora: string | null;
  lugares: { categoria: Categoria; subtipo: string | null } | null;
};

/**
 * Relatos no ar (sem os ocultos por denúncia), só com o necessário para as estatísticas,
 * e quantos lugares diferentes eles cobrem.
 */
export async function relatosParaEstatistica(): Promise<{
  relatos: RelatoEstatistica[];
  lugaresAvaliados: number;
}> {
  const admin = criarClienteAdmin();
  const { data, error } = await admin
    .from("relatos")
    .select(`lugar_id, ${ESTIMULOS.join(", ")}, sempre_assim, data, hora, lugares(categoria, subtipo)`)
    .eq("oculto", false)
    .limit(100_000);
  if (error) throw error;
  const linhas = ((data ?? []) as unknown as LinhaRelato[]).filter((r) => r.lugares);
  const relatos = linhas.map((r) => ({
      categoria: r.lugares!.categoria,
      subtipo: r.lugares!.subtipo,
      intensidades: Object.fromEntries(ESTIMULOS.map((e) => [e, r[e]])) as Record<Estimulo, Intensidade | null>,
      sempreAssim: r.sempre_assim,
      data: r.data,
      hora: r.hora,
    }));
  return { relatos, lugaresAvaliados: new Set(linhas.map((r) => r.lugar_id)).size };
}

const DIA_MS = 24 * 60 * 60 * 1000;

export type MetricasInternas = {
  relatos: { total: number; ultimos7: number; ultimos30: number; comTexto: number; ocultos: number };
  /** Relatos por semana (mais antiga primeiro), últimas 8 semanas. */
  /** Relatos por semana de calendário (segunda a domingo), da mais antiga à atual. */
  relatosPorSemana: { inicio: string; fim: string; total: number }[];
  lugares: { total: number; avaliados: number; adicionadosPelaComunidade: number };
  contas: {
    total: number;
    novas7: number;
    novas30: number;
    /** Entraram no site (com o código) nos últimos 30 dias. */
    entraram30: number;
    /** Publicaram pelo menos um relato nos últimos 30 dias. */
    contribuiram30: number;
    /** Já publicaram pelo menos um relato. */
    jaRelataram: number;
  };
  denunciasAbertas: number;
  maisRelatados: { nome: string; total: number }[];
  /** Os 5 lugares com relato mais recente (sem repetir lugar), do mais novo para o mais antigo. */
  ultimosAvaliados: { id: string; nome: string; quando: string }[];
};

/** Números de uso da plataforma, para quem mantém o projeto. Só contagens. */
export async function metricasInternas(agora = new Date()): Promise<MetricasInternas> {
  const admin = criarClienteAdmin();
  const desde = (dias: number) => new Date(agora.getTime() - dias * DIA_MS);

  const [relatosRes, lugaresTotal, lugaresComunidade, denuncias, contas] = await Promise.all([
    admin.from("relatos").select("lugar_id, usuario_id, criado_em, oculto, o_que_esperar, lugares(nome)").limit(100_000),
    admin.from("lugares").select("id", { count: "exact", head: true }),
    admin.from("lugares").select("id", { count: "exact", head: true }).eq("origem", "usuario"),
    admin.from("denuncias").select("id", { count: "exact", head: true }).eq("resolvida", false),
    listarContas(admin),
  ]);
  if (relatosRes.error) throw relatosRes.error;

  type R = {
    lugar_id: string;
    usuario_id: string;
    criado_em: string;
    oculto: boolean;
    o_que_esperar: string | null;
    lugares: { nome: string } | null;
  };
  const relatos = (relatosRes.data ?? []) as unknown as R[];
  const noAr = relatos.filter((r) => !r.oculto);
  const depois = (r: { criado_em: string }, dias: number) => new Date(r.criado_em) >= desde(dias);

  const diasDosRelatos = relatos.map((r) => diaEmSaoPaulo(r.criado_em));
  const relatosPorSemana = ultimasSemanas(agora, 8).map((s) => ({
    ...s,
    total: diasDosRelatos.filter((d) => d >= s.inicio && d <= s.fim).length,
  }));

  const porLugar = new Map<string, { nome: string; total: number }>();
  for (const r of noAr) {
    const atual = porLugar.get(r.lugar_id) ?? { nome: r.lugares?.nome ?? "?", total: 0 };
    atual.total += 1;
    porLugar.set(r.lugar_id, atual);
  }

  return {
    relatos: {
      total: relatos.length,
      ultimos7: relatos.filter((r) => depois(r, 7)).length,
      ultimos30: relatos.filter((r) => depois(r, 30)).length,
      comTexto: relatos.filter((r) => r.o_que_esperar?.trim()).length,
      ocultos: relatos.length - noAr.length,
    },
    relatosPorSemana,
    lugares: {
      total: lugaresTotal.count ?? 0,
      avaliados: porLugar.size,
      adicionadosPelaComunidade: lugaresComunidade.count ?? 0,
    },
    contas: {
      total: contas.length,
      novas7: contas.filter((c) => new Date(c.created_at) >= desde(7)).length,
      novas30: contas.filter((c) => new Date(c.created_at) >= desde(30)).length,
      entraram30: contas.filter((c) => c.last_sign_in_at && new Date(c.last_sign_in_at) >= desde(30)).length,
      contribuiram30: new Set(relatos.filter((r) => depois(r, 30)).map((r) => r.usuario_id)).size,
      jaRelataram: new Set(relatos.map((r) => r.usuario_id)).size,
    },
    denunciasAbertas: denuncias.count ?? 0,
    maisRelatados: [...porLugar.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    ultimosAvaliados: ultimosLugares(noAr, 5),
  };
}

/** Lugares com relato mais recente, sem repetir lugar. */
function ultimosLugares(
  relatos: { lugar_id: string; criado_em: string; lugares: { nome: string } | null }[],
  quantos: number,
): { id: string; nome: string; quando: string }[] {
  const vistos = new Set<string>();
  const lista: { id: string; nome: string; quando: string }[] = [];
  for (const r of [...relatos].sort((a, b) => b.criado_em.localeCompare(a.criado_em))) {
    if (vistos.has(r.lugar_id)) continue;
    vistos.add(r.lugar_id);
    lista.push({ id: r.lugar_id, nome: r.lugares?.nome ?? "?", quando: r.criado_em });
    if (lista.length >= quantos) break;
  }
  return lista;
}

/** Todas as contas (só datas de criação e último acesso), página por página. */
async function listarContas(admin: ReturnType<typeof criarClienteAdmin>) {
  const contas: { created_at: string; last_sign_in_at: string | null }[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    contas.push(
      ...data.users.map((u) => ({ created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null })),
    );
    if (data.users.length < 1000) break;
  }
  return contas;
}
