// Entende buscas por tipo de lugar: "cafeterias", "café no Bom Fim", "posto de saúde".
// A palavra de tipo vira filtro (categoria e subtipo); o resto continua como texto,
// para achar bairro, rua ou nome. Função pura: não acessa o banco.

import type { Categoria } from "./estimulos";

type Tipo = {
  categoria: Categoria;
  /** Subtipos do OpenStreetMap (ver scripts/importar-osm.ts). Sem eles, vale a categoria toda. */
  subtipos?: string[];
  /** Como mostrar na tela: "Mostrando cafés". */
  rotulo: string;
  /** Palavra que também vale no nome do lugar ("Café do Porto"). */
  palavra?: string;
};

const CAFE: Tipo = { categoria: "restaurante_cafe", subtipos: ["cafe"], rotulo: "cafés", palavra: "cafe" };
const RESTAURANTE: Tipo = {
  categoria: "restaurante_cafe",
  subtipos: ["restaurante", "praca_alimentacao"],
  rotulo: "restaurantes",
  palavra: "restaurante",
};
const LANCHONETE: Tipo = {
  categoria: "restaurante_cafe",
  subtipos: ["lanchonete"],
  rotulo: "lanchonetes",
  palavra: "lanche",
};
const COMIDA: Tipo = { categoria: "restaurante_cafe", rotulo: "restaurantes e cafés" };
const HOSPITAL: Tipo = { categoria: "saude", subtipos: ["hospital"], rotulo: "hospitais", palavra: "hospital" };
const CLINICA: Tipo = { categoria: "saude", subtipos: ["clinica"], rotulo: "clínicas e postos de saúde" };
const SAUDE: Tipo = { categoria: "saude", rotulo: "lugares de saúde" };
const ESTACAO: Tipo = { categoria: "transporte", subtipos: ["estacao"], rotulo: "estações" };
const RODOVIARIA: Tipo = { categoria: "transporte", subtipos: ["rodoviaria"], rotulo: "rodoviárias e terminais" };
const PRACA: Tipo = { categoria: "parque_praca", subtipos: ["praca"], rotulo: "praças", palavra: "praca" };

/**
 * Palavras e expressões (sem acento, minúsculas, no singular) e o tipo de lugar.
 * Expressões mais longas têm prioridade: "praca de alimentacao" antes de "praca".
 */
const TERMOS: Record<string, Tipo> = {
  cafe: CAFE,
  cafeteria: CAFE,
  cafezinho: CAFE,
  "coffee shop": CAFE,
  restaurante: RESTAURANTE,
  "praca de alimentacao": {
    categoria: "restaurante_cafe",
    subtipos: ["praca_alimentacao"],
    rotulo: "praças de alimentação",
  },
  lanchonete: LANCHONETE,
  lanche: LANCHONETE,
  "fast food": LANCHONETE,
  hamburgueria: LANCHONETE,
  comida: COMIDA,
  "onde comer": COMIDA,
  almoco: COMIDA,
  jantar: COMIDA,
  shopping: { categoria: "shopping", rotulo: "shoppings" },
  "shopping center": { categoria: "shopping", rotulo: "shoppings" },
  "centro comercial": { categoria: "shopping", rotulo: "shoppings" },
  mercado: { categoria: "supermercado", rotulo: "mercados" },
  supermercado: { categoria: "supermercado", rotulo: "supermercados" },
  hipermercado: { categoria: "supermercado", rotulo: "supermercados" },
  atacado: { categoria: "supermercado", rotulo: "supermercados" },
  parque: { categoria: "parque_praca", subtipos: ["parque"], rotulo: "parques", palavra: "parque" },
  praca: PRACA,
  pracinha: PRACA,
  hospital: HOSPITAL,
  "pronto socorro": HOSPITAL,
  emergencia: HOSPITAL,
  clinica: CLINICA,
  consultorio: CLINICA,
  "posto de saude": CLINICA,
  ubs: CLINICA,
  laboratorio: { categoria: "saude", subtipos: ["laboratorio"], rotulo: "laboratórios" },
  exame: { categoria: "saude", subtipos: ["laboratorio"], rotulo: "laboratórios" },
  saude: SAUDE,
  museu: { categoria: "cultura", subtipos: ["museu"], rotulo: "museus", palavra: "museu" },
  cinema: { categoria: "cultura", subtipos: ["cinema"], rotulo: "cinemas", palavra: "cinema" },
  teatro: { categoria: "cultura", subtipos: ["teatro"], rotulo: "teatros", palavra: "teatro" },
  "centro cultural": { categoria: "cultura", subtipos: ["centro_cultural"], rotulo: "centros culturais" },
  cultura: { categoria: "cultura", rotulo: "lugares de cultura" },
  rodoviaria: RODOVIARIA,
  terminal: RODOVIARIA,
  onibus: { categoria: "transporte", rotulo: "lugares de transporte" },
  aeroporto: { categoria: "transporte", subtipos: ["aeroporto"], rotulo: "aeroportos" },
  estacao: ESTACAO,
  trem: ESTACAO,
  trensurb: ESTACAO,
  metro: ESTACAO,
  transporte: { categoria: "transporte", rotulo: "lugares de transporte" },
  prefeitura: { categoria: "servico_publico", subtipos: ["prefeitura"], rotulo: "prefeituras" },
  tribunal: { categoria: "servico_publico", subtipos: ["tribunal"], rotulo: "tribunais e fóruns" },
  forum: { categoria: "servico_publico", subtipos: ["tribunal"], rotulo: "tribunais e fóruns" },
  delegacia: { categoria: "servico_publico", subtipos: ["policia"], rotulo: "delegacias e polícia" },
  policia: { categoria: "servico_publico", subtipos: ["policia"], rotulo: "delegacias e polícia" },
  correio: { categoria: "servico_publico", subtipos: ["correios"], rotulo: "agências dos Correios" },
  cras: { categoria: "servico_publico", subtipos: ["assistencia_social"], rotulo: "assistência social" },
  creas: { categoria: "servico_publico", subtipos: ["assistencia_social"], rotulo: "assistência social" },
  "assistencia social": {
    categoria: "servico_publico",
    subtipos: ["assistencia_social"],
    rotulo: "assistência social",
  },
  "servico publico": { categoria: "servico_publico", rotulo: "serviços públicos" },
  "orgao publico": { categoria: "servico_publico", rotulo: "serviços públicos" },
};

/** Palavras de ligação que sobram ao tirar o tipo: "café NO Bom Fim", "museus EM Recife". */
const LIGACAO = new Set(["no", "na", "nos", "nas", "em", "de", "do", "da", "dos", "das", "perto", "proximo", "proxima", "um", "uma", "uns", "umas", "o", "a", "os", "as"]);

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Singular simples para o português: "cafeterias" → "cafeteria", "hospitais" → "hospital". */
function singular(palavra: string): string {
  if (palavra.length <= 3) return palavra;
  if (palavra.endsWith("oes") || palavra.endsWith("aes")) return palavra.slice(0, -3) + "ao";
  if (palavra.endsWith("ais")) return palavra.slice(0, -2) + "l";
  if (palavra.endsWith("eis")) return palavra.slice(0, -2) + "l";
  if (palavra.endsWith("res") || palavra.endsWith("zes")) return palavra.slice(0, -2);
  if (palavra.endsWith("s") && !palavra.endsWith("ss")) return palavra.slice(0, -1);
  return palavra;
}

export type BuscaInterpretada = {
  /** Texto que sobra para procurar no nome, no endereço e no bairro. */
  termo: string;
  /** Tipo de lugar reconhecido, ou null. */
  tipo: Tipo | null;
};

/** Separa da busca a palavra de tipo de lugar, se houver. */
export function interpretarBusca(busca: string): BuscaInterpretada {
  const palavras = normalizar(busca).split(" ").filter(Boolean);
  const singulares = palavras.map(singular);
  // Procura a expressão mais longa (até 3 palavras) que seja um tipo de lugar.
  for (let tamanho = 3; tamanho >= 1; tamanho--) {
    for (let i = 0; i + tamanho <= singulares.length; i++) {
      // Como foi escrita ("onibus") ou no singular ("cafeterias" → "cafeteria").
      const tipo =
        TERMOS[palavras.slice(i, i + tamanho).join(" ")] ??
        TERMOS[singulares.slice(i, i + tamanho).join(" ")];
      if (!tipo) continue;
      const resto = palavras
        .filter((_, j) => j < i || j >= i + tamanho)
        .filter((p) => !LIGACAO.has(p));
      return { termo: resto.join(" "), tipo };
    }
  }
  return { termo: busca.trim(), tipo: null };
}
