import { describe, expect, it } from "vitest";
import { problemaNoTexto } from "./moderacao";

describe("problemaNoTexto", () => {
  it("aceita relatos comuns", () => {
    for (const t of [
      "Tem revista na entrada.",
      "A praça de alimentação fica lotada no almoço, das 12h às 14h.",
      "Fica cheio na sexta. Mesa 12 é perto da janela.",
      "Ar-condicionado forte; leve um casaco.",
      "Recepção cumprimenta todo mundo, bem tranquilo.",
      "Abre às 10h30 e fecha 22h.",
      "Tem macacos no parque, fazem barulho de manhã.",
      "",
      null,
    ]) {
      expect(problemaNoTexto(t), String(t)).toBeNull();
    }
  });

  it("barra dados pessoais", () => {
    expect(problemaNoTexto("me chama em fulano@gmail.com")).toBe("email");
    expect(problemaNoTexto("liga (51) 99999-1234")).toBe("telefone");
    expect(problemaNoTexto("whats 51999991234")).toBe("telefone");
    expect(problemaNoTexto("cpf 123.456.789-10")).toBe("cpf");
  });

  it("barra links e perfis", () => {
    expect(problemaNoTexto("veja https://exemplo.com/x")).toBe("link");
    expect(problemaNoTexto("site www.lugar.com.br")).toBe("link");
    expect(problemaNoTexto("segue @perfil_falso")).toBe("perfil");
  });

  it("barra ofensas, inclusive disfarçadas", () => {
    expect(problemaNoTexto("o atendente é um idiota")).toBe("ofensa");
    expect(problemaNoTexto("que IDIOTAAA")).toBe("ofensa");
    expect(problemaNoTexto("1d10ta")).toBe("ofensa");
    expect(problemaNoTexto("filho da puta")).toBe("ofensa");
    expect(problemaNoTexto("autismo é frescura")).toBe("ofensa");
  });
});
