import { describe, expect, it } from "vitest";
import type { Badge } from "./calculo";
import { caminhoLugar, resumoNiveis, textoCompartilhar } from "./compartilhar";
import type { DetalheLugar } from "./dados";
import type { Estimulo, Nivel } from "./estimulos";

function badges(niveis: Partial<Record<Estimulo, Nivel>>): Record<Estimulo, Badge | null> {
  const todos: Estimulo[] = ["som", "luz", "cheiro", "lotacao", "visual", "temperatura"];
  return Object.fromEntries(
    todos.map((e) => [
      e,
      niveis[e] ? { estimulo: e, nivel: niveis[e], media: 0, total: 1, poucosRelatos: true } : null,
    ]),
  ) as Record<Estimulo, Badge | null>;
}

const lugar = { id: "abc", nome: "Café Teste" } as DetalheLugar["lugar"];

describe("compartilhar", () => {
  it("resume os níveis com concordância", () => {
    expect(resumoNiveis(badges({ som: "alto", luz: "baixo", temperatura: "medio" }))).toBe(
      "Som alto · Luz baixa · Temperatura média",
    );
    expect(resumoNiveis(badges({}))).toBeNull();
  });

  it("monta o texto com e sem relatos", () => {
    expect(textoCompartilhar({ lugar, badges: badges({ lotacao: "alto" }) })).toBe(
      "Como é lá? Café Teste: Lotação alta. Veja antes de ir no Mapa Sensorial.",
    );
    expect(textoCompartilhar({ lugar, badges: badges({}) })).toContain("Ainda ninguém contou");
  });

  it("aponta para o painel do lugar na página inicial", () => {
    expect(caminhoLugar("abc")).toBe("/?lugar=abc");
  });
});
