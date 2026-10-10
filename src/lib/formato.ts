// Formatação de datas em português, no fuso de Porto Alegre.

const FUSO = "America/Sao_Paulo";

export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: FUSO,
  });
}

/** Data (AAAA-MM-DD) e hora (HH:MM[:SS]) informadas no relato. */
export function formatarQuando(data: string, hora: string | null): string {
  const d = new Date(`${data}T12:00:00Z`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return hora ? `${d}, por volta das ${hora.slice(0, 5)}` : d;
}

export function hojeEmPortoAlegre(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: FUSO });
}
