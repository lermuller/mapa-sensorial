// Lista fixa de estímulos, intensidades e categorias de lugar (SPEC.md).

export const ESTIMULOS = [
  "som",
  "luz",
  "cheiro",
  "lotacao",
  "visual",
  "temperatura",
] as const;

export type Estimulo = (typeof ESTIMULOS)[number];

/** 0 = baixo, 1 = médio, 2 = alto */
export type Intensidade = 0 | 1 | 2;

export const NIVEIS = ["baixo", "medio", "alto"] as const;
export type Nivel = (typeof NIVEIS)[number];

/** Cor do estímulo (variável CSS da identidade visual). */
export const COR_ESTIMULO: Record<Estimulo, string> = {
  som: "var(--c-som)",
  luz: "var(--c-luz)",
  cheiro: "var(--c-cheiro)",
  lotacao: "var(--c-lotacao)",
  visual: "var(--c-visual)",
  temperatura: "var(--c-temperatura)",
};

export const ROTULO_NIVEL: Record<Nivel, string> = {
  baixo: "Baixo",
  medio: "Médio",
  alto: "Alto",
};

const FEMININOS: ReadonlySet<Estimulo> = new Set(["luz", "lotacao", "temperatura"]);

/** Nível concordando com o estímulo: "Som baixo", "Luz baixa". */
export function rotuloNivel(e: Estimulo, n: Nivel): string {
  if (!FEMININOS.has(e) || n === "medio") return ROTULO_NIVEL[n];
  return n === "baixo" ? "Baixa" : "Alta";
}

/** Nível dentro de uma frase, com concordância completa: "temperatura média". */
export function nivelNaFrase(e: Estimulo, n: Nivel): string {
  if (FEMININOS.has(e) && n === "medio") return "média";
  return rotuloNivel(e, n).toLowerCase();
}

export const INFO_ESTIMULO: Record<
  Estimulo,
  { nome: string; cobre: string; badge: Record<Nivel, string> }
> = {
  som: {
    nome: "Som",
    cobre: "Volume, música ambiente, ruídos súbitos, eco",
    badge: { baixo: "Som baixo", medio: "Som moderado", alto: "Som alto" },
  },
  luz: {
    nome: "Luz",
    cobre: "Luz forte, fluorescente, piscante, telas",
    badge: { baixo: "Luz suave", medio: "Luz moderada", alto: "Luz forte" },
  },
  cheiro: {
    nome: "Cheiro",
    cobre: "Perfumes, comida, produtos de limpeza",
    badge: { baixo: "Pouco cheiro", medio: "Cheiro moderado", alto: "Cheiro forte" },
  },
  lotacao: {
    nome: "Lotação",
    cobre: "Quantidade de pessoas, filas, contato físico",
    badge: { baixo: "Pouca lotação", medio: "Lotação moderada", alto: "Muito cheio" },
  },
  visual: {
    nome: "Visual",
    cobre: "Poluição visual, propagandas, movimento",
    badge: { baixo: "Visual calmo", medio: "Visual moderado", alto: "Muita poluição visual" },
  },
  temperatura: {
    nome: "Temperatura",
    cobre: "Muito frio (ar-condicionado) ou muito quente",
    badge: {
      baixo: "Temperatura agradável",
      medio: "Temperatura variável",
      alto: "Temperatura extrema",
    },
  },
};

export const CATEGORIAS = [
  "shopping",
  "supermercado",
  "restaurante_cafe",
  "parque_praca",
  "saude",
  "cultura",
  "transporte",
  "servico_publico",
  "outros",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  shopping: "Shopping",
  supermercado: "Supermercado",
  restaurante_cafe: "Restaurante ou café",
  parque_praca: "Parque ou praça",
  saude: "Saúde",
  cultura: "Cultura",
  transporte: "Transporte",
  servico_publico: "Serviço público",
  outros: "Outros",
};

export const DESCRICAO_CATEGORIA: Partial<Record<Categoria, string>> = {
  saude: "clínica, hospital, laboratório",
  cultura: "museu, cinema, teatro",
  transporte: "rodoviária, aeroporto, estação",
};

export function ehEstimulo(v: string): v is Estimulo {
  return (ESTIMULOS as readonly string[]).includes(v);
}

export function ehCategoria(v: string): v is Categoria {
  return (CATEGORIAS as readonly string[]).includes(v);
}
