import { describe, expect, it } from "vitest";
import { diaEmSaoPaulo, rotuloSemana, ultimasSemanas } from "./semanas";

describe("semanas do gráfico de métricas", () => {
  it("usa o dia de São Paulo (relato às 23h de domingo não pula para segunda)", () => {
    expect(diaEmSaoPaulo("2026-10-19T02:30:00Z")).toBe("2026-10-18");
  });

  it("monta semanas de segunda a domingo, terminando na atual", () => {
    // 19/10/2026 é segunda-feira; 19h em São Paulo.
    const semanas = ultimasSemanas(new Date("2026-10-19T22:00:00Z"), 3);
    expect(semanas).toEqual([
      { inicio: "2026-10-05", fim: "2026-10-11" },
      { inicio: "2026-10-12", fim: "2026-10-18" },
      { inicio: "2026-10-19", fim: "2026-10-25" },
    ]);
  });

  it("escreve o intervalo, com os dois meses quando a semana vira o mês", () => {
    expect(rotuloSemana("2026-10-13", "2026-10-19")).toBe("13–19 out.");
    expect(rotuloSemana("2026-09-28", "2026-10-04")).toBe("28 set.–4 out.");
  });
});
