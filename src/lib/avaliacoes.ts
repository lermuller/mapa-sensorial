// Avaliação de vários lugares de uma vez (/avaliar): uma linha por lugar, só os níveis dos
// estímulos (sem texto). Funções puras: leitura da planilha e conversão dos valores.

import { ESTIMULOS, type Estimulo } from "./estimulos";

/** Lugar escolhido numa linha: "id:<uuid>" (na base) ou "osm:node/123" (gravado ao salvar). */
export type OpcaoLugar = { ref: string; nome: string; detalhe: string };

/** "" = não reparei; "0" baixo, "1" médio, "2" alto. */
export type ValorNivel = "" | "0" | "1" | "2";

export type Quando = "sempre" | "manha" | "tarde" | "noite";

export type LinhaAvaliacao = {
  ref: string;
  niveis: Record<Estimulo, ValorNivel>;
  quando: Quando;
  /** AAAA-MM-DD; obrigatória quando não é "sempre". */
  data: string;
};

/** Hora gravada para cada período (entra no cálculo do melhor horário). */
export const HORA_DO_PERIODO: Record<Exclude<Quando, "sempre">, string> = {
  manha: "09:00",
  tarde: "15:00",
  noite: "20:00",
};

export const MAXIMO_POR_ENVIO = 100;

export function niveisVazios(): Record<Estimulo, ValorNivel> {
  return Object.fromEntries(ESTIMULOS.map((e) => [e, ""])) as Record<Estimulo, ValorNivel>;
}

function semAcento(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** "baixo", "Média", "alta", "2"… → valor do nível; vazio ou desconhecido → "não reparei". */
export function lerNivel(valor: string): ValorNivel {
  const v = semAcento(valor);
  if (/^(baix[oa]|0|b)$/.test(v)) return "0";
  if (/^(medi[oa]|1|m)$/.test(v)) return "1";
  if (/^(alt[oa]|2|a)$/.test(v)) return "2";
  return "";
}

export function lerQuando(valor: string): Quando {
  const v = semAcento(valor);
  if (v.startsWith("manh")) return "manha";
  if (v.startsWith("tard")) return "tarde";
  if (v.startsWith("noit")) return "noite";
  return "sempre";
}

/** Datas "2026-10-10" ou "10/10/2026" → AAAA-MM-DD; inválida → "". */
export function lerData(valor: string): string {
  const v = valor.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
}

/** Separa um CSV em linhas e colunas (aspas, ";" ou ","), detectando o separador no cabeçalho. */
export function separarCsv(texto: string): string[][] {
  const limpo = texto.replace(/^﻿/, "");
  const primeira = limpo.split(/\r?\n/, 1)[0] ?? "";
  const sep = (primeira.match(/;/g)?.length ?? 0) >= (primeira.match(/,/g)?.length ?? 0) ? ";" : ",";
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let aspas = false;
  for (let i = 0; i < limpo.length; i++) {
    const c = limpo[i];
    if (aspas) {
      if (c === '"' && limpo[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) {
      linha.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpo[i + 1] === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else campo += c;
  }
  if (campo || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((c) => c.trim()));
}

export type LinhaPlanilha = {
  /** Texto para encontrar o lugar: nome + onde fica. */
  busca: string;
  niveis: Record<Estimulo, ValorNivel>;
  quando: Quando;
  data: string;
};

/** Lê a planilha do modelo (colunas pelo nome do cabeçalho, em qualquer ordem). */
export function lerPlanilha(texto: string): { linhas: LinhaPlanilha[]; erro?: string } {
  const [cabecalho, ...corpo] = separarCsv(texto);
  if (!cabecalho) return { linhas: [], erro: "A planilha está vazia." };
  const colunas = cabecalho.map(semAcento);
  const col = (...nomes: string[]) => colunas.findIndex((c) => nomes.includes(c));
  const iLugar = col("lugar", "nome", "nome do lugar");
  if (iLugar < 0) return { linhas: [], erro: "Falta a coluna “lugar” no cabeçalho. Use o modelo." };
  const iOnde = col("onde", "endereco", "cidade", "bairro", "endereco ou cidade");
  const iQuando = col("quando", "periodo");
  const iData = col("data");
  const iEstimulo = Object.fromEntries(ESTIMULOS.map((e) => [e, col(e, e === "lotacao" ? "lotação" : e)]));
  const linhas = corpo
    .map((c) => {
      const pega = (i: number) => (i >= 0 ? (c[i] ?? "") : "");
      const nome = pega(iLugar).trim();
      // Linhas vazias e notas do modelo ("# ...") ficam de fora.
      if (!nome || nome.startsWith("#")) return null;
      return {
        busca: [nome, pega(iOnde).trim()].filter(Boolean).join(" "),
        niveis: Object.fromEntries(ESTIMULOS.map((e) => [e, lerNivel(pega(iEstimulo[e]))])) as Record<Estimulo, ValorNivel>,
        quando: lerQuando(pega(iQuando)),
        data: lerData(pega(iData)),
      };
    })
    .filter((l): l is LinhaPlanilha => l !== null);
  if (linhas.length > MAXIMO_POR_ENVIO) {
    return { linhas: linhas.slice(0, MAXIMO_POR_ENVIO), erro: `Só as primeiras ${MAXIMO_POR_ENVIO} linhas foram lidas.` };
  }
  return { linhas };
}
