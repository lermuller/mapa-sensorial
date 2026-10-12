// Regras de cálculo de badges e melhor horário (SPEC.md › Regras de cálculo).
// Funções puras: recebem os relatos e a data de referência, não acessam o banco.

import { ESTIMULOS, type Estimulo, type Intensidade, type Nivel } from "./estimulos";

/** Pontos de partida, revisar quando houver dados reais. */
export const JANELA_MESES = 12;
export const MEIA_VIDA_MESES = 6;
/** Mínimo de relatos para o nível de um estímulo aparecer no lugar (com 1, já aparece com o aviso). */
export const MINIMO_BADGE = 1;
/** Mínimo de relatos para valer um horário: melhor horário, grade da semana e filtro "Quando vou". */
export const MINIMO_RELATOS = 2;
/** Com até este número de relatos o badge aparece com o aviso "poucos relatos". */
export const POUCOS_RELATOS_ATE = 4;

const DIA_MS = 24 * 60 * 60 * 1000;
const MES_DIAS = 365.25 / 12;

export type DiaFaixa = "util" | "fds";
export type PeriodoFaixa = "manha" | "tarde" | "noite";
export type Faixa = { dia: DiaFaixa; periodo: PeriodoFaixa };

export const DIAS_FAIXA: DiaFaixa[] = ["util", "fds"];
export const PERIODOS_FAIXA: PeriodoFaixa[] = ["manha", "tarde", "noite"];

export const ROTULO_DIA: Record<DiaFaixa, string> = {
  util: "Dia útil",
  fds: "Fim de semana",
};
/** Nome curto do período, sem o horário. */
export const NOME_PERIODO: Record<PeriodoFaixa, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export const ROTULO_PERIODO: Record<PeriodoFaixa, string> = {
  manha: "Manhã (6h–12h)",
  tarde: "Tarde (12h–18h)",
  noite: "Noite (18h–24h)",
};
export const ROTULO_PERIODO_CURTO: Record<PeriodoFaixa, string> = {
  manha: "de manhã",
  tarde: "à tarde",
  noite: "à noite",
};

export type RelatoCalculo = {
  intensidades: Partial<Record<Estimulo, Intensidade | null>>;
  sempreAssim: boolean;
  /** AAAA-MM-DD, quando o relato tem data */
  data: string | null;
  /** HH:MM ou HH:MM:SS, quando o relato tem horário */
  hora: string | null;
  /** ISO 8601 */
  criadoEm: string;
};

export type Badge = {
  estimulo: Estimulo;
  nivel: Nivel;
  media: number;
  total: number;
  poucosRelatos: boolean;
};

export function nivelDaMedia(media: number): Nivel {
  if (media < 0.67) return "baixo";
  if (media <= 1.33) return "medio";
  return "alto";
}

/** Data a que o relato se refere: a data informada ou, se "é sempre assim", a de criação. */
function dataReferencia(r: RelatoCalculo): Date {
  if (!r.sempreAssim && r.data) return new Date(`${r.data}T12:00:00Z`);
  return new Date(r.criadoEm);
}

/** Peso por recência: cai pela metade a cada MEIA_VIDA_MESES. null = fora da janela. */
export function pesoRecencia(r: RelatoCalculo, agora: Date): number | null {
  const meses = (agora.getTime() - dataReferencia(r).getTime()) / DIA_MS / MES_DIAS;
  if (meses > JANELA_MESES) return null;
  return Math.pow(0.5, Math.max(meses, 0) / MEIA_VIDA_MESES);
}

/** Faixa de um relato com horário; null para "é sempre assim" ou madrugada (0h–6h). */
export function faixaDoRelato(r: Pick<RelatoCalculo, "sempreAssim" | "data" | "hora">): Faixa | null {
  if (r.sempreAssim || !r.data || !r.hora) return null;
  const hora = Number(r.hora.slice(0, 2));
  let periodo: PeriodoFaixa;
  if (hora >= 6 && hora < 12) periodo = "manha";
  else if (hora >= 12 && hora < 18) periodo = "tarde";
  else if (hora >= 18) periodo = "noite";
  else return null;
  const diaSemana = new Date(`${r.data}T12:00:00Z`).getUTCDay();
  const dia: DiaFaixa = diaSemana === 0 || diaSemana === 6 ? "fds" : "util";
  return { dia, periodo };
}

/**
 * Relato entra na faixa (completa ou parcial) se for "é sempre assim"
 * ou se tiver horário dentro dela.
 */
export function relatoNaFaixa(r: RelatoCalculo, filtro: Partial<Faixa>): boolean {
  if (r.sempreAssim) return true;
  const f = faixaDoRelato(r);
  if (!f) return false;
  return (!filtro.dia || f.dia === filtro.dia) && (!filtro.periodo || f.periodo === filtro.periodo);
}

type Acumulado = { soma: number; pesos: number; total: number };

function badgeDe(estimulo: Estimulo, a: Acumulado, minimo: number): Badge | null {
  if (a.total < minimo || a.pesos === 0) return null;
  const media = a.soma / a.pesos;
  return {
    estimulo,
    nivel: nivelDaMedia(media),
    media,
    total: a.total,
    poucosRelatos: a.total <= POUCOS_RELATOS_ATE,
  };
}

/** Badges por estímulo. null quando não há relatos suficientes. */
export function calcularBadges(
  relatos: RelatoCalculo[],
  agora: Date,
  filtro?: Partial<Faixa>,
  minimo = MINIMO_BADGE,
): Record<Estimulo, Badge | null> {
  const acc = Object.fromEntries(
    ESTIMULOS.map((e) => [e, { soma: 0, pesos: 0, total: 0 }]),
  ) as Record<Estimulo, Acumulado>;

  for (const r of relatos) {
    if (filtro && (filtro.dia || filtro.periodo) && !relatoNaFaixa(r, filtro)) continue;
    const peso = pesoRecencia(r, agora);
    if (peso === null) continue;
    for (const e of ESTIMULOS) {
      const v = r.intensidades[e];
      if (v === null || v === undefined) continue;
      acc[e].soma += v * peso;
      acc[e].pesos += peso;
      acc[e].total += 1;
    }
  }

  return Object.fromEntries(ESTIMULOS.map((e) => [e, badgeDe(e, acc[e], minimo)])) as Record<
    Estimulo,
    Badge | null
  >;
}

/**
 * Badges para um horário escolhido ("Quando vou"): usa os relatos da faixa
 * quando houver relatos suficientes para o estímulo; senão, o cálculo geral.
 */
export function calcularBadgesParaFaixa(
  relatos: RelatoCalculo[],
  agora: Date,
  filtro: Partial<Faixa>,
): { badges: Record<Estimulo, Badge | null>; daFaixa: Set<Estimulo> } {
  const geral = calcularBadges(relatos, agora);
  const daFaixa = new Set<Estimulo>();
  if (!filtro.dia && !filtro.periodo) return { badges: geral, daFaixa };
  // Um horário só substitui o geral com relatos suficientes (1 relato de manhã não basta).
  const naFaixa = calcularBadges(relatos, agora, filtro, MINIMO_RELATOS);
  const badges = { ...geral };
  for (const e of ESTIMULOS) {
    if (naFaixa[e]) {
      badges[e] = naFaixa[e];
      daFaixa.add(e);
    }
  }
  return { badges, daFaixa };
}

export type ResultadoFaixa = Faixa & {
  media: number;
  nivel: Nivel;
  total: number;
};

/**
 * Intensidade média por faixa considerando os estímulos escolhidos
 * (todos, se a lista vier vazia). Só entram faixas com relatos suficientes
 * e pelo menos um relato com horário naquela faixa.
 */
export function calcularFaixas(
  relatos: RelatoCalculo[],
  agora: Date,
  estimulos: readonly Estimulo[] = ESTIMULOS,
): ResultadoFaixa[] {
  const considerar = estimulos.length > 0 ? estimulos : ESTIMULOS;
  const resultado: ResultadoFaixa[] = [];

  for (const dia of DIAS_FAIXA) {
    for (const periodo of PERIODOS_FAIXA) {
      let soma = 0;
      let pesos = 0;
      let total = 0;
      let comHorario = 0;
      for (const r of relatos) {
        if (!relatoNaFaixa(r, { dia, periodo })) continue;
        const peso = pesoRecencia(r, agora);
        if (peso === null) continue;
        const valores = considerar
          .map((e) => r.intensidades[e])
          .filter((v): v is Intensidade => v !== null && v !== undefined);
        if (valores.length === 0) continue;
        const mediaRelato = valores.reduce<number>((a, b) => a + b, 0) / valores.length;
        soma += mediaRelato * peso;
        pesos += peso;
        total += 1;
        if (!r.sempreAssim) comHorario += 1;
      }
      if (total >= MINIMO_RELATOS && comHorario > 0) {
        const media = soma / pesos;
        resultado.push({ dia, periodo, media, nivel: nivelDaMedia(media), total });
      }
    }
  }
  return resultado;
}

/** A faixa mais tranquila (menor média; empate: mais relatos). */
export function melhorHorario(
  relatos: RelatoCalculo[],
  agora: Date,
  estimulos: readonly Estimulo[] = ESTIMULOS,
): ResultadoFaixa | null {
  const faixas = calcularFaixas(relatos, agora, estimulos);
  if (faixas.length === 0) return null;
  return faixas.reduce((melhor, f) =>
    f.media < melhor.media || (f.media === melhor.media && f.total > melhor.total) ? f : melhor,
  );
}

/**
 * Pontuação para ordenar a busca por sensibilidade: média dos badges dos
 * estímulos escolhidos. null quando nenhum deles tem badge.
 */
export function pontuacaoSensibilidade(
  badges: Record<Estimulo, Badge | null>,
  estimulos: readonly Estimulo[],
): number | null {
  const medias = estimulos
    .map((e) => badges[e]?.media)
    .filter((m): m is number => m !== undefined);
  if (medias.length === 0) return null;
  return medias.reduce((a, b) => a + b, 0) / medias.length;
}
