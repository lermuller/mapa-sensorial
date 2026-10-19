import { describe, expect, it } from "vitest";
import { lerData, lerNivel, lerPlanilha, lerQuando, separarCsv } from "./avaliacoes";

describe("avaliações em lote", () => {
  it("entende os níveis escritos de vários jeitos", () => {
    expect(["baixo", "Baixa", "0"].map(lerNivel)).toEqual(["0", "0", "0"]);
    expect(["médio", "Média", "1"].map(lerNivel)).toEqual(["1", "1", "1"]);
    expect(["ALTO", "alta", "2"].map(lerNivel)).toEqual(["2", "2", "2"]);
    expect(["", "não reparei", "?"].map(lerNivel)).toEqual(["", "", ""]);
  });

  it("entende quando e a data", () => {
    expect(["Manhã", "tarde", "noite", "", "é sempre assim"].map(lerQuando)).toEqual([
      "manha",
      "tarde",
      "noite",
      "sempre",
      "sempre",
    ]);
    expect(lerData("10/3/2026")).toBe("2026-03-10");
    expect(lerData("2026-10-01")).toBe("2026-10-01");
    expect(lerData("ontem")).toBe("");
  });

  it("separa CSV com ponto e vírgula e aspas", () => {
    expect(separarCsv('lugar;onde\n"Café ""Bom"";Centro"\nOutro;x\n')).toEqual([
      ["lugar", "onde"],
      ['Café "Bom";Centro'],
      ["Outro", "x"],
    ]);
    expect(separarCsv("a,b\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("lê a planilha do modelo, com colunas em qualquer ordem", () => {
    const csv = "﻿Lugar;Onde;Som;Luz;Cheiro;Lotação;Visual;Temperatura;Quando;Data\n" +
      "Café Teste;Bom Fim, Porto Alegre;alto;baixo;;médio;;;tarde;10/10/2026\n" +
      ";sem nome;alto\n";
    const { linhas, erro } = lerPlanilha(csv);
    expect(erro).toBeUndefined();
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({
      busca: "Café Teste Bom Fim, Porto Alegre",
      quando: "tarde",
      data: "2026-10-10",
      niveis: { som: "2", luz: "0", cheiro: "", lotacao: "1", visual: "", temperatura: "" },
    });
    expect(lerPlanilha("Nome;som\nCafé;alto").linhas[0].busca).toBe("Café");
    // Lugares sem nenhum nível (não visitados) ficam de fora e são contados.
    expect(lerPlanilha("lugar;som;luz\nA;alto;\nB;;\nC;;baixa\n")).toMatchObject({ ignoradas: 1, linhas: [{ busca: "A" }, { busca: "C" }] });
    expect(lerPlanilha("coluna;x\n1;2").erro).toContain("lugar");
    expect(lerPlanilha("lugar;som\nCafé;alto\n# nota do modelo;\n").linhas).toHaveLength(1);
  });
});
