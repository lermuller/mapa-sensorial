// Modelo de planilha para /avaliar. Ponto e vírgula e BOM: abre certo no Excel em português.
export function GET() {
  const linhas = [
    "lugar;onde;som;luz;cheiro;lotacao;visual;temperatura;quando;data",
    "Café Exemplo;Bom Fim, Porto Alegre;alto;baixa;médio;;baixo;;tarde;10/10/2026",
    "Livraria Exemplo;Centro, Curitiba;baixo;média;;baixa;;média;sempre;",
    "",
    "# Níveis: baixo, médio ou alto (vazio = não reparei). Quando: sempre, manhã, tarde ou noite.",
    "# Data (dia/mês/ano) só quando não for 'sempre'. Apague as linhas de exemplo e estas notas.",
  ];
  return new Response("﻿" + linhas.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mapa-sensorial-avaliacoes.csv"',
    },
  });
}
