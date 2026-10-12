import { paraCsv, resumirGrupos } from "@/lib/estatisticas";
import { relatosParaEstatistica } from "@/lib/metricas";

// CSV dos dados abertos (/dados): estímulos por tipo de lugar, sem dados pessoais.
export async function GET() {
  const { relatos } = await relatosParaEstatistica();
  // Data de Porto Alegre (AAAA-MM-DD), a mesma mostrada na página.
  const data = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  return new Response(paraCsv(resumirGrupos(relatos)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mapa-sensorial-dados-${data}.csv"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
