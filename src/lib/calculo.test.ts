import { describe, expect, it } from "vitest";
import {
  calcularBadges,
  calcularBadgesParaFaixa,
  calcularFaixas,
  faixaDoRelato,
  melhorHorario,
  nivelDaMedia,
  pesoRecencia,
  pontuacaoSensibilidade,
  type RelatoCalculo,
} from "./calculo";

const AGORA = new Date("2026-10-09T12:00:00Z");

function relato(p: Partial<RelatoCalculo> & Pick<RelatoCalculo, "intensidades">): RelatoCalculo {
  return {
    sempreAssim: true,
    data: null,
    hora: null,
    criadoEm: "2026-10-01T12:00:00Z",
    ...p,
  };
}

/** Relato com horário. 2026-10-05 é segunda; 2026-10-03 é sábado. */
function comHorario(
  intensidades: RelatoCalculo["intensidades"],
  data: string,
  hora: string,
): RelatoCalculo {
  return relato({ intensidades, sempreAssim: false, data, hora, criadoEm: `${data}T20:00:00Z` });
}

describe("nivelDaMedia", () => {
  it("usa os limites da especificação", () => {
    expect(nivelDaMedia(0)).toBe("baixo");
    expect(nivelDaMedia(0.66)).toBe("baixo");
    expect(nivelDaMedia(0.67)).toBe("medio");
    expect(nivelDaMedia(1.33)).toBe("medio");
    expect(nivelDaMedia(1.34)).toBe("alto");
    expect(nivelDaMedia(2)).toBe("alto");
  });
});

describe("pesoRecencia", () => {
  it("cai pela metade a cada 6 meses", () => {
    const hoje = relato({ intensidades: {}, criadoEm: AGORA.toISOString() });
    const seisMeses = relato({ intensidades: {}, criadoEm: "2026-04-09T12:00:00Z" });
    expect(pesoRecencia(hoje, AGORA)).toBeCloseTo(1);
    expect(pesoRecencia(seisMeses, AGORA)).toBeCloseTo(0.5, 1);
  });

  it("ignora relatos com mais de 12 meses", () => {
    const antigo = relato({ intensidades: {}, criadoEm: "2025-09-01T12:00:00Z" });
    expect(pesoRecencia(antigo, AGORA)).toBeNull();
  });

  it("usa a data informada, não a de criação, para relatos com horário", () => {
    const r = relato({
      intensidades: {},
      sempreAssim: false,
      data: "2025-08-01",
      hora: "10:00",
      criadoEm: "2026-10-01T12:00:00Z",
    });
    expect(pesoRecencia(r, AGORA)).toBeNull();
  });
});

describe("calcularBadges", () => {
  it("não mostra badge com menos de 2 relatos", () => {
    const b = calcularBadges([relato({ intensidades: { som: 2 } })], AGORA);
    expect(b.som).toBeNull();
  });

  it("calcula nível e aviso de poucos relatos", () => {
    const b = calcularBadges(
      [relato({ intensidades: { som: 2 } }), relato({ intensidades: { som: 2, luz: 0 } })],
      AGORA,
    );
    expect(b.som).toMatchObject({ nivel: "alto", total: 2, poucosRelatos: true });
    expect(b.luz).toBeNull();
  });

  it("tira o aviso a partir de 5 relatos", () => {
    const rs = Array.from({ length: 5 }, () => relato({ intensidades: { lotacao: 0 } }));
    expect(calcularBadges(rs, AGORA).lotacao).toMatchObject({
      nivel: "baixo",
      poucosRelatos: false,
    });
  });

  it("ignora 'não reparei'", () => {
    const b = calcularBadges(
      [
        relato({ intensidades: { som: 1, cheiro: null } }),
        relato({ intensidades: { som: 1, cheiro: 2 } }),
      ],
      AGORA,
    );
    expect(b.som?.nivel).toBe("medio");
    expect(b.cheiro).toBeNull();
  });

  it("dá mais peso aos relatos recentes", () => {
    const b = calcularBadges(
      [
        relato({ intensidades: { som: 0 }, criadoEm: "2026-10-08T12:00:00Z" }),
        relato({ intensidades: { som: 2 }, criadoEm: "2025-11-01T12:00:00Z" }),
      ],
      AGORA,
    );
    // peso ~1 para 0 e ~0,3 para 2 → média ~0,46
    expect(b.som?.nivel).toBe("baixo");
  });
});

describe("faixaDoRelato", () => {
  it("classifica dia e período", () => {
    expect(faixaDoRelato(comHorario({}, "2026-10-05", "09:30"))).toEqual({
      dia: "util",
      periodo: "manha",
    });
    expect(faixaDoRelato(comHorario({}, "2026-10-03", "19:00"))).toEqual({
      dia: "fds",
      periodo: "noite",
    });
    expect(faixaDoRelato(comHorario({}, "2026-10-04", "12:00:00"))).toEqual({
      dia: "fds",
      periodo: "tarde",
    });
  });

  it("não classifica madrugada nem 'é sempre assim'", () => {
    expect(faixaDoRelato(comHorario({}, "2026-10-05", "03:00"))).toBeNull();
    expect(faixaDoRelato(relato({ intensidades: {} }))).toBeNull();
  });
});

describe("calcularBadgesParaFaixa", () => {
  it("usa os relatos da faixa quando há suficientes e cai no geral quando não", () => {
    const rs = [
      comHorario({ lotacao: 0, som: 2 }, "2026-10-05", "08:00"),
      comHorario({ lotacao: 0 }, "2026-10-06", "09:00"),
      comHorario({ lotacao: 2, som: 2 }, "2026-10-03", "13:00"),
      comHorario({ lotacao: 2 }, "2026-10-04", "14:00"),
    ];
    const { badges, daFaixa } = calcularBadgesParaFaixa(rs, AGORA, {
      dia: "util",
      periodo: "manha",
    });
    expect(badges.lotacao?.nivel).toBe("baixo");
    expect(daFaixa.has("lotacao")).toBe(true);
    // som só tem 1 relato de manhã → usa o geral (2 relatos)
    expect(badges.som?.nivel).toBe("alto");
    expect(daFaixa.has("som")).toBe(false);
  });

  it("'é sempre assim' entra em todas as faixas", () => {
    const rs = [
      relato({ intensidades: { luz: 2 } }),
      comHorario({ luz: 2 }, "2026-10-03", "20:00"),
    ];
    const { badges, daFaixa } = calcularBadgesParaFaixa(rs, AGORA, { dia: "fds" });
    expect(badges.luz?.total).toBe(2);
    expect(daFaixa.has("luz")).toBe(true);
  });
});

describe("melhorHorario", () => {
  const rs = [
    comHorario({ lotacao: 0, som: 0 }, "2026-10-05", "08:00"),
    comHorario({ lotacao: 0, som: 1 }, "2026-10-06", "10:00"),
    comHorario({ lotacao: 2, som: 2 }, "2026-10-03", "13:00"),
    comHorario({ lotacao: 2, som: 2 }, "2026-10-04", "15:00"),
    comHorario({ lotacao: 1 }, "2026-10-07", "19:00"),
  ];

  it("escolhe a faixa mais tranquila com pelo menos 2 relatos", () => {
    expect(melhorHorario(rs, AGORA)).toMatchObject({ dia: "util", periodo: "manha", total: 2 });
  });

  it("não considera faixas com só 1 relato", () => {
    const faixas = calcularFaixas(rs, AGORA);
    expect(faixas.map((f) => `${f.dia}-${f.periodo}`).sort()).toEqual([
      "fds-tarde",
      "util-manha",
    ]);
  });

  it("considera só os estímulos do perfil", () => {
    const outros = [
      comHorario({ som: 2, luz: 0 }, "2026-10-05", "08:00"),
      comHorario({ som: 2, luz: 0 }, "2026-10-06", "09:00"),
      comHorario({ som: 0, luz: 2 }, "2026-10-05", "14:00"),
      comHorario({ som: 0, luz: 2 }, "2026-10-06", "15:00"),
    ];
    expect(melhorHorario(outros, AGORA, ["som"])?.periodo).toBe("tarde");
    expect(melhorHorario(outros, AGORA, ["luz"])?.periodo).toBe("manha");
  });

  it("não inventa melhor horário só com relatos 'é sempre assim'", () => {
    const sempre = [relato({ intensidades: { som: 0 } }), relato({ intensidades: { som: 0 } })];
    expect(melhorHorario(sempre, AGORA)).toBeNull();
  });
});

describe("pontuacaoSensibilidade", () => {
  it("faz a média dos estímulos escolhidos que têm badge", () => {
    const b = calcularBadges(
      [relato({ intensidades: { som: 0, luz: 2 } }), relato({ intensidades: { som: 0, luz: 2 } })],
      AGORA,
    );
    expect(pontuacaoSensibilidade(b, ["som", "luz"])).toBe(1);
    expect(pontuacaoSensibilidade(b, ["som", "cheiro"])).toBe(0);
    expect(pontuacaoSensibilidade(b, ["cheiro"])).toBeNull();
  });
});
