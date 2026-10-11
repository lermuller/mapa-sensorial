import { describe, expect, it } from "vitest";
import { interpretarBusca } from "./busca";

describe("interpretarBusca", () => {
  it("reconhece tipo de lugar no plural e sem acento", () => {
    for (const q of ["cafeterias", "Cafés", "cafe", "cafeteria"]) {
      const r = interpretarBusca(q);
      expect(r.tipo?.subtipos, q).toEqual(["cafe"]);
      expect(r.termo, q).toBe("");
    }
    expect(interpretarBusca("hospitais").tipo?.subtipos).toEqual(["hospital"]);
    expect(interpretarBusca("restaurantes").tipo?.categoria).toBe("restaurante_cafe");
    expect(interpretarBusca("ônibus").tipo?.categoria).toBe("transporte");
    expect(interpretarBusca("museus").tipo?.subtipos).toEqual(["museu"]);
  });

  it("separa o tipo do resto (bairro, nome)", () => {
    expect(interpretarBusca("café no Bom Fim")).toMatchObject({ termo: "bom fim" });
    expect(interpretarBusca("museus em Porto Alegre")).toMatchObject({ termo: "" });
    expect(interpretarBusca("Shopping Iguatemi")).toMatchObject({ termo: "iguatemi" });
  });

  it("prefere a expressão mais longa", () => {
    expect(interpretarBusca("praça de alimentação").tipo?.subtipos).toEqual(["praca_alimentacao"]);
    expect(interpretarBusca("posto de saúde").tipo?.subtipos).toEqual(["clinica"]);
  });

  it("deixa como está quando não há tipo", () => {
    expect(interpretarBusca("Brizza Forneria")).toEqual({ termo: "Brizza Forneria", tipo: null });
  });
});
