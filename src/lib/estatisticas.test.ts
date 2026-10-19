import { describe, expect, it } from "vitest";
import type { Estimulo, Intensidade } from "./estimulos";
import {
  MINIMO_PUBLICO,
  paraCsv,
  resumirFaixas,
  resumirGrupos,
  type RelatoEstatistica,
} from "./estatisticas";

function relato(
  parcial: Partial<RelatoEstatistica> & { niveis?: Partial<Record<Estimulo, Intensidade>> } = {},
): RelatoEstatistica {
  const { niveis = {}, ...resto } = parcial;
  return {
    categoria: "restaurante_cafe",
    subtipo: "cafe",
    sempreAssim: true,
    data: null,
    hora: null,
    intensidades: { som: null, luz: null, cheiro: null, lotacao: null, visual: null, temperatura: null, ...niveis },
    ...resto,
  };
}

describe("resumirGrupos", () => {
  it("mostra tipos com poucos relatos, marcados como amostra pequena", () => {
    const poucos = Array.from({ length: MINIMO_PUBLICO - 1 }, () => relato({ niveis: { som: 2 } }));
    const cafes = resumirGrupos(poucos).find((g) => g.id === "cafes")!;
    expect(cafes).toMatchObject({ relatos: 4, amostraPequena: true, maisAlto: { estimulo: "som", percentual: 100 } });
    // Tipos sem relatos também vêm (para o seletor), com zero.
    expect(resumirGrupos(poucos).find((g) => g.id === "museus" || g.id === "cultura")?.relatos).toBe(0);
  });

  it("conta níveis e acha o estímulo mais relatado como alto", () => {
    const rs = [
      ...Array.from({ length: 4 }, () => relato({ niveis: { som: 2, luz: 0 } })),
      relato({ niveis: { som: 1, luz: 2 } }),
      relato({ subtipo: "restaurante", niveis: { som: 0 } }),
    ];
    const grupos = resumirGrupos(rs);
    const cafes = grupos.find((g) => g.id === "cafes")!;
    expect(cafes.relatos).toBe(5);
    expect(cafes.porEstimulo.som).toEqual({ avaliacoes: 5, baixo: 0, medio: 1, alto: 4 });
    expect(cafes.maisAlto).toEqual({ estimulo: "som", percentual: 80 });
    expect(cafes.amostraPequena).toBe(false);
    // Restaurantes têm só 1 relato: aparecem como amostra pequena.
    expect(grupos.find((g) => g.id === "restaurantes")).toMatchObject({ relatos: 1, amostraPequena: true });
    expect(grupos.find((g) => g.id === "todos")?.relatos).toBe(6);
  });
});

describe("resumirFaixas", () => {
  it("separa por dia e período e ignora 'é sempre assim'", () => {
    const rs = [
      relato({ sempreAssim: false, data: "2026-10-10", hora: "15:00", niveis: { lotacao: 2 } }), // sábado
      relato({ sempreAssim: false, data: "2026-10-07", hora: "09:30", niveis: { lotacao: 0 } }), // quarta
      relato({ niveis: { lotacao: 2 } }),
    ];
    const f = resumirFaixas(rs);
    expect(f.find((x) => x.dia === "fds" && x.periodo === "tarde")?.porEstimulo.lotacao.alto).toBe(1);
    expect(f.find((x) => x.dia === "util" && x.periodo === "manha")?.relatos).toBe(1);
    expect(f.reduce((s, x) => s + x.relatos, 0)).toBe(2);
  });
});

describe("paraCsv", () => {
  it("marca amostras pequenas e deixa de fora tipos sem relatos", () => {
    const rs = Array.from({ length: 5 }, (_, i) => relato({ niveis: { som: 2, ...(i === 0 ? { luz: 1 } : {}) } }));
    rs.push(relato({ subtipo: "restaurante", niveis: { som: 0 } }));
    const csv = paraCsv(resumirGrupos(rs));
    expect(csv).toContain('"Cafés",5,nao,som,5,0,0,5,100');
    expect(csv).toContain('"Cafés",5,nao,luz,1,0,1,0,0');
    expect(csv).toContain('"Restaurantes",1,sim,som,1,1,0,0,0');
    expect(csv).not.toContain("Museus");
  });
});
