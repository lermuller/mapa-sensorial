import "server-only";
import {
  calcularBadges,
  calcularBadgesParaFaixa,
  JANELA_MESES,
  pontuacaoSensibilidade,
  type Badge,
  type Faixa,
  type RelatoCalculo,
} from "./calculo";
import {
  ESTIMULOS,
  ehEstimulo,
  type Categoria,
  type Estimulo,
  type Intensidade,
} from "./estimulos";
import { criarClienteServidor } from "./supabase/server";

export type Lugar = {
  id: string;
  nome: string;
  categoria: Categoria;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  lat: number;
  lng: number;
  origem: "osm" | "usuario";
  /** 3 pessoas ou mais disseram que o lugar não existe ou fechou. */
  talvez_fechado?: boolean;
};

export type RelatoLinha = {
  id: string;
  lugar_id: string;
  usuario_id: string;
  som: Intensidade | null;
  luz: Intensidade | null;
  cheiro: Intensidade | null;
  lotacao: Intensidade | null;
  visual: Intensidade | null;
  temperatura: Intensidade | null;
  sempre_assim: boolean;
  data: string | null;
  hora: string | null;
  o_que_esperar: string | null;
  comentario: string | null;
  criado_em: string;
  editado_em: string | null;
  /** Denunciado por 2 pessoas: fora do ar até a moderação revisar (só o autor vê). */
  oculto: boolean;
};

export type Relato = RelatoLinha & { nome_publico: string; avatar: string | null };

export function paraCalculo(r: RelatoLinha): RelatoCalculo {
  return {
    intensidades: Object.fromEntries(ESTIMULOS.map((e) => [e, r[e]])),
    sempreAssim: r.sempre_assim,
    data: r.data,
    hora: r.hora,
    criadoEm: r.criado_em,
  };
}

function inicioDaJanela(agora: Date): string {
  const d = new Date(agora);
  d.setMonth(d.getMonth() - JANELA_MESES);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Busca
// ---------------------------------------------------------------------------

export type FiltrosBusca = {
  termo: string;
  categorias: Categoria[];
  estimulos: Estimulo[];
  faixa: Partial<Faixa>;
  /** Retângulo visível do mapa. Sem ele, busca na cidade toda. */
  area: Area | null;
  /** Busca por tipo ("cafés"): subtipos aceitos e a palavra que também vale no nome. */
  subtipos?: string[];
  palavra?: string;
};

export type Area = { sul: number; oeste: number; norte: number; leste: number };

export const LIMITE_BUSCA = 100;

export type ResultadoBusca = Lugar & {
  /** "node/123" quando veio do OpenStreetMap. */
  osmId: string | null;
  totalRelatos: number;
  badges: Record<Estimulo, Badge | null>;
  pontuacao: number | null;
};

export async function buscarLugares(filtros: FiltrosBusca): Promise<ResultadoBusca[]> {
  const supabase = await criarClienteServidor();
  const { data: lugares, error } = await supabase.rpc("buscar_lugares", {
    termo: filtros.termo || null,
    categorias: filtros.categorias.length ? filtros.categorias : null,
    ...(filtros.area ?? {}),
    limite: LIMITE_BUSCA,
    subtipos: filtros.subtipos?.length ? filtros.subtipos : null,
    palavra: filtros.palavra || null,
  });
  if (error) throw error;
  if (!lugares || lugares.length === 0) return [];

  const agora = new Date();
  const comRelatos = lugares.filter((l: { total_relatos: number }) => l.total_relatos > 0);
  const relatosPorLugar = new Map<string, RelatoCalculo[]>();

  if (comRelatos.length > 0) {
    // Relatos com horário são filtrados pela data; os "é sempre assim", pela criação.
    const { data: relatos, error: erroRelatos } = await supabase
      .from("relatos")
      .select("*")
      .in(
        "lugar_id",
        comRelatos.map((l: { id: string }) => l.id),
      )
      .eq("oculto", false)
      .or(
        `and(sempre_assim.eq.true,criado_em.gte.${inicioDaJanela(agora)}),and(sempre_assim.eq.false,data.gte.${inicioDaJanela(agora).slice(0, 10)})`,
      );
    if (erroRelatos) throw erroRelatos;
    for (const r of (relatos ?? []) as RelatoLinha[]) {
      const lista = relatosPorLugar.get(r.lugar_id) ?? [];
      lista.push(paraCalculo(r));
      relatosPorLugar.set(r.lugar_id, lista);
    }
  }

  const resultados: ResultadoBusca[] = lugares.map(
    (l: Lugar & { total_relatos: number; osm_id: string | null }) => {
      const relatos = relatosPorLugar.get(l.id) ?? [];
      const { badges } = calcularBadgesParaFaixa(relatos, agora, filtros.faixa);
      return {
        id: l.id,
        nome: l.nome,
        categoria: l.categoria,
        endereco: l.endereco,
        bairro: l.bairro,
        cidade: l.cidade,
        uf: l.uf,
        osmId: l.osm_id,
        talvez_fechado: l.talvez_fechado,
        lat: l.lat,
        lng: l.lng,
        origem: l.origem,
        totalRelatos: Number(l.total_relatos),
        badges,
        pontuacao: pontuacaoSensibilidade(badges, filtros.estimulos),
      };
    },
  );

  if (filtros.estimulos.length > 0) {
    // Intensidade baixa primeiro; quem não tem dados nos estímulos escolhidos vai para o fim.
    const cobertura = (r: ResultadoBusca) =>
      filtros.estimulos.filter((e) => r.badges[e]).length;
    resultados.sort((a, b) => {
      if (a.pontuacao === null && b.pontuacao === null) return 0;
      if (a.pontuacao === null) return 1;
      if (b.pontuacao === null) return -1;
      return a.pontuacao - b.pontuacao || cobertura(b) - cobertura(a);
    });
  }

  return resultados;
}

// ---------------------------------------------------------------------------
// Lugar
// ---------------------------------------------------------------------------

/** Ids na nossa base dos lugares do OpenStreetMap que já foram gravados ("node/123" → id). */
export async function idsPorOsm(osmIds: string[]): Promise<Map<string, string>> {
  if (osmIds.length === 0) return new Map();
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("lugares").select("id, osm_id").in("osm_id", osmIds);
  return new Map((data ?? []).map((l: { id: string; osm_id: string }) => [l.osm_id, l.id]));
}

/** Resultado de fora da base (OpenStreetMap), com o endereço que abre o lugar. */
export type ResultadoExterno = ResultadoBusca & { href: string };

export async function obterLugar(id: string): Promise<Lugar | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("lugares")
    .select("id, nome, categoria, endereco, bairro, cidade, uf, lat, lng, origem, talvez_fechado")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Lugar | null;
}

async function comNomesPublicos(linhas: RelatoLinha[]): Promise<Relato[]> {
  if (linhas.length === 0) return [];
  const supabase = await criarClienteServidor();
  const ids = [...new Set(linhas.map((r) => r.usuario_id))];
  const { data } = await supabase
    .from("nomes_publicos")
    .select("id, nome_publico, avatar")
    .in("id", ids);
  const pessoas = new Map(
    (data ?? []).map((n) => [n.id as string, n as { nome_publico: string; avatar: string | null }]),
  );
  return linhas.map((r) => ({
    ...r,
    nome_publico: pessoas.get(r.usuario_id)?.nome_publico ?? "Anônimo",
    avatar: pessoas.get(r.usuario_id)?.avatar ?? null,
  }));
}

/** Todos os relatos do lugar, do mais recente para o mais antigo. */
export async function relatosDoLugar(lugarId: string): Promise<Relato[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("relatos")
    .select("*")
    .eq("lugar_id", lugarId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return comNomesPublicos((data ?? []) as RelatoLinha[]);
}

export async function obterRelato(id: string): Promise<RelatoLinha | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.from("relatos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as RelatoLinha | null;
}

export async function relatosDoUsuario(
  usuarioId: string,
): Promise<(RelatoLinha & { lugar_nome: string })[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("relatos")
    .select("*, lugares(nome)")
    .eq("usuario_id", usuarioId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const { lugares, ...resto } = r as RelatoLinha & { lugares: { nome: string } | null };
    return { ...resto, lugar_nome: lugares?.nome ?? "" };
  });
}

export async function obterCadastro(usuarioId: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("usuarios")
    .select("id, nome, nome_publico, perfil_sensorial, avatar")
    .eq("id", usuarioId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    nome: data.nome as string,
    nome_publico: data.nome_publico as string,
    avatar: data.avatar as string,
    perfil: ((data.perfil_sensorial ?? []) as string[]).filter(ehEstimulo),
  };
}

/** Perfil sensorial guardado na conta (só a própria pessoa lê, pela RLS). */
export async function obterPerfil(usuarioId: string): Promise<Estimulo[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("usuarios")
    .select("perfil_sensorial")
    .eq("id", usuarioId)
    .maybeSingle();
  return ((data?.perfil_sensorial ?? []) as string[]).filter(ehEstimulo);
}

export { calcularBadges };

// ---------------------------------------------------------------------------
// Detalhe do lugar (painel sobre o mapa)
// ---------------------------------------------------------------------------

export type DetalheLugar = {
  lugar: Lugar;
  totalRelatos: number;
  badges: Record<Estimulo, Badge | null>;
  relatos: RelatoCalculo[];
  oQueEsperar: { id: string; texto: string; quando: string }[];
  /** ISO; referência dos cálculos, para o cliente usar a mesma data do servidor */
  agora: string;
};

export async function obterDetalheLugar(id: string): Promise<DetalheLugar | null> {
  const lugar = await obterLugar(id);
  if (!lugar) return null;
  // Relatos em revisão (ocultos) não entram nos cálculos, nem para quem os escreveu.
  const relatos = (await relatosDoLugar(id)).filter((r) => !r.oculto);
  const agora = new Date();
  const calculo = relatos.map(paraCalculo);
  return {
    lugar,
    totalRelatos: relatos.length,
    badges: calcularBadges(calculo, agora),
    relatos: calculo,
    oQueEsperar: relatos
      .filter((r) => r.o_que_esperar?.trim())
      .slice(0, 3)
      .map((r) => ({ id: r.id, texto: r.o_que_esperar!, quando: r.criado_em })),
    agora: agora.toISOString(),
  };
}
