// Semanas de calendário (segunda a domingo) no horário de Brasília, para o gráfico de
// relatos por semana nas métricas. Funções puras.

/** Data (AAAA-MM-DD) de um instante no horário de São Paulo. */
export function diaEmSaoPaulo(instante: Date | string): string {
  return new Date(instante).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

function somarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** As últimas `quantas` semanas (a última é a atual), cada uma de segunda a domingo. */
export function ultimasSemanas(agora: Date, quantas: number): { inicio: string; fim: string }[] {
  const hoje = diaEmSaoPaulo(agora);
  // getUTCDay: 0 = domingo. Volta até a segunda-feira desta semana.
  const diaDaSemana = new Date(`${hoje}T12:00:00Z`).getUTCDay();
  const segunda = somarDias(hoje, -((diaDaSemana + 6) % 7));
  return Array.from({ length: quantas }, (_, i) => {
    const inicio = somarDias(segunda, -7 * (quantas - 1 - i));
    return { inicio, fim: somarDias(inicio, 6) };
  });
}

const MESES = ["jan.", "fev.", "mar.", "abr.", "maio", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];

/** "13–19 out." ou, se virar o mês, "29 set.–5 out.". */
export function rotuloSemana(inicio: string, fim: string): string {
  const [, mi, di] = inicio.split("-").map(Number);
  const [, mf, df] = fim.split("-").map(Number);
  return mi === mf ? `${di}–${df} ${MESES[mf - 1]}` : `${di} ${MESES[mi - 1]}–${df} ${MESES[mf - 1]}`;
}
