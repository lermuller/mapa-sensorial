// Leitura dos parâmetros de URL da busca.

import type { DiaFaixa, Faixa, PeriodoFaixa } from "./calculo";
import type { Area } from "./dados";
import { ehCategoria, ehEstimulo, type Categoria, type Estimulo } from "./estimulos";

type Params = Record<string, string | string[] | undefined>;

export function lista(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return (Array.isArray(v) ? v : [v]).flatMap((s) => s.split(",")).filter(Boolean);
}

export function primeiro(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export type ParamsBusca = {
  termo: string;
  categorias: Categoria[];
  estimulos: Estimulo[];
  faixa: Partial<Faixa>;
  area: Area | null;
  /** O formulário de filtros ou de busca já foi usado. */
  filtrado: boolean;
  /**
   * Usar o perfil sensorial da conta na busca. Ligado por padrão; depois que a pessoa
   * usa os filtros, vale o que ela marcou (perfil=1). Os estímulos do perfil nunca vão na URL.
   */
  usarPerfil: boolean;
};

export function lerParamsBusca(p: Params): ParamsBusca {
  const dia = primeiro(p.dia);
  const periodo = primeiro(p.periodo);
  return {
    termo: primeiro(p.q).trim().slice(0, 100),
    categorias: lista(p.tipo).filter(ehCategoria),
    estimulos: lista(p.sens).filter(ehEstimulo),
    faixa: {
      dia: dia === "util" || dia === "fds" ? (dia as DiaFaixa) : undefined,
      periodo:
        periodo === "manha" || periodo === "tarde" || periodo === "noite"
          ? (periodo as PeriodoFaixa)
          : undefined,
    },
    area: lerArea(primeiro(p.area)),
    filtrado: primeiro(p.f) === "1",
    usarPerfil: primeiro(p.f) !== "1" || primeiro(p.perfil) === "1",
  };
}

/** "sul,oeste,norte,leste" com 4 casas decimais. */
function lerArea(v: string): Area | null {
  const n = v.split(",").map(Number);
  if (n.length !== 4 || n.some((x) => !Number.isFinite(x))) return null;
  const [sul, oeste, norte, leste] = n;
  if (sul >= norte || oeste >= leste) return null;
  return { sul, oeste, norte, leste };
}

export function areaParaTexto(a: Area): string {
  return [a.sul, a.oeste, a.norte, a.leste].map((x) => x.toFixed(4)).join(",");
}
