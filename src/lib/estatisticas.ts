// Estatísticas públicas dos relatos (página /dados e CSV para pesquisas).
// Só dados agregados sobre os lugares: nada de contas, nomes, textos ou perfis sensoriais.
// Funções puras: recebem os relatos já lidos do banco.

import { faixaDoRelato, DIAS_FAIXA, PERIODOS_FAIXA, type DiaFaixa, type PeriodoFaixa } from "./calculo";
import { ESTIMULOS, type Categoria, type Estimulo, type Intensidade } from "./estimulos";

/** Menos que isso não aparece: evita conclusões (e exposição) com poucos relatos. */
export const MINIMO_PUBLICO = 5;

export type RelatoEstatistica = {
  categoria: Categoria;
  subtipo: string | null;
  intensidades: Record<Estimulo, Intensidade | null>;
  sempreAssim: boolean;
  data: string | null;
  hora: string | null;
};

type Grupo = { id: string; rotulo: string; inclui: (r: RelatoEstatistica) => boolean };

const deCategoria = (c: Categoria) => (r: RelatoEstatistica) => r.categoria === c;
const deSubtipo = (s: string) => (r: RelatoEstatistica) => r.subtipo === s;

/** Tipos de lugar das estatísticas. Comida é separada por subtipo (cafés ≠ restaurantes). */
export const GRUPOS: Grupo[] = [
  { id: "todos", rotulo: "Todos os lugares", inclui: () => true },
  { id: "cafes", rotulo: "Cafés", inclui: deSubtipo("cafe") },
  { id: "restaurantes", rotulo: "Restaurantes", inclui: deSubtipo("restaurante") },
  { id: "lanchonetes", rotulo: "Lanchonetes", inclui: deSubtipo("lanchonete") },
  { id: "pracas_alimentacao", rotulo: "Praças de alimentação", inclui: deSubtipo("praca_alimentacao") },
  { id: "shoppings", rotulo: "Shoppings", inclui: deCategoria("shopping") },
  { id: "supermercados", rotulo: "Supermercados", inclui: deCategoria("supermercado") },
  { id: "parques_pracas", rotulo: "Parques e praças", inclui: deCategoria("parque_praca") },
  { id: "saude", rotulo: "Saúde", inclui: deCategoria("saude") },
  { id: "cultura", rotulo: "Cultura", inclui: deCategoria("cultura") },
  { id: "transporte", rotulo: "Transporte", inclui: deCategoria("transporte") },
  { id: "servico_publico", rotulo: "Serviços públicos", inclui: deCategoria("servico_publico") },
  { id: "outros", rotulo: "Outros", inclui: deCategoria("outros") },
];

export type Contagem = { avaliacoes: number; baixo: number; medio: number; alto: number };

export type ResumoGrupo = {
  id: string;
  rotulo: string;
  relatos: number;
  porEstimulo: Record<Estimulo, Contagem>;
  /** Estímulo com maior parte de avaliações "alto" (entre os com dados suficientes). */
  maisAlto: { estimulo: Estimulo; percentual: number } | null;
};

function vazio(): Record<Estimulo, Contagem> {
  return Object.fromEntries(
    ESTIMULOS.map((e) => [e, { avaliacoes: 0, baixo: 0, medio: 0, alto: 0 }]),
  ) as Record<Estimulo, Contagem>;
}

function contar(relatos: RelatoEstatistica[]): Record<Estimulo, Contagem> {
  const c = vazio();
  for (const r of relatos) {
    for (const e of ESTIMULOS) {
      const v = r.intensidades[e];
      if (v === null || v === undefined) continue;
      c[e].avaliacoes += 1;
      c[e][v === 0 ? "baixo" : v === 1 ? "medio" : "alto"] += 1;
    }
  }
  return c;
}

/** Percentual inteiro (0–100) de uma parte. */
export function percentual(parte: number, total: number): number {
  return total === 0 ? 0 : Math.round((parte / total) * 100);
}

/** O número tem relatos suficientes para ser mostrado. */
export function suficiente(c: Contagem): boolean {
  return c.avaliacoes >= MINIMO_PUBLICO;
}

/** Resumo de cada tipo de lugar com pelo menos MINIMO_PUBLICO relatos. */
export function resumirGrupos(relatos: RelatoEstatistica[]): ResumoGrupo[] {
  const resultado: ResumoGrupo[] = [];
  for (const g of GRUPOS) {
    const doGrupo = relatos.filter(g.inclui);
    if (doGrupo.length < MINIMO_PUBLICO) continue;
    const porEstimulo = contar(doGrupo);
    let maisAlto: ResumoGrupo["maisAlto"] = null;
    for (const e of ESTIMULOS) {
      const c = porEstimulo[e];
      if (!suficiente(c)) continue;
      const p = percentual(c.alto, c.avaliacoes);
      if (p > 0 && (!maisAlto || p > maisAlto.percentual)) maisAlto = { estimulo: e, percentual: p };
    }
    resultado.push({ id: g.id, rotulo: g.rotulo, relatos: doGrupo.length, porEstimulo, maisAlto });
  }
  return resultado;
}

export type ResumoFaixa = {
  dia: DiaFaixa;
  periodo: PeriodoFaixa;
  relatos: number;
  porEstimulo: Record<Estimulo, Contagem>;
};

/** Como os estímulos variam por dia e horário (só relatos com data e hora). */
export function resumirFaixas(relatos: RelatoEstatistica[]): ResumoFaixa[] {
  const resultado: ResumoFaixa[] = [];
  for (const dia of DIAS_FAIXA) {
    for (const periodo of PERIODOS_FAIXA) {
      const naFaixa = relatos.filter((r) => {
        const f = faixaDoRelato(r);
        return f?.dia === dia && f.periodo === periodo;
      });
      resultado.push({ dia, periodo, relatos: naFaixa.length, porEstimulo: contar(naFaixa) });
    }
  }
  return resultado;
}

/** CSV dos tipos de lugar, um estímulo por linha. Células com poucos dados ficam vazias. */
export function paraCsv(grupos: ResumoGrupo[]): string {
  const linhas = [
    "tipo_de_lugar,relatos,estimulo,avaliacoes,baixo,medio,alto,percentual_alto",
  ];
  for (const g of grupos) {
    for (const e of ESTIMULOS) {
      const c = g.porEstimulo[e];
      const ok = suficiente(c);
      linhas.push(
        [
          `"${g.rotulo}"`,
          g.relatos,
          e,
          c.avaliacoes,
          ok ? c.baixo : "",
          ok ? c.medio : "",
          ok ? c.alto : "",
          ok ? percentual(c.alto, c.avaliacoes) : "",
        ].join(","),
      );
    }
  }
  return linhas.join("\n") + "\n";
}
