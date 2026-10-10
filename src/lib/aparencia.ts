// Preferências de aparência (tema e contraste). Ficam num cookie para que o
// servidor já renderize o modo certo, sem piscar ao carregar. Não são dados pessoais.
// "auto" segue o aparelho: prefers-color-scheme e prefers-contrast (ver globals.css).

export const COOKIE_TEMA = "tema";
export const COOKIE_CONTRASTE = "contraste";

export const TEMAS = ["auto", "claro", "escuro"] as const;
export type Tema = (typeof TEMAS)[number];

export const CONTRASTES = ["auto", "suave", "alto"] as const;
export type Contraste = (typeof CONTRASTES)[number];

export function lerTema(v: string | undefined): Tema {
  return v === "claro" || v === "escuro" ? v : "auto";
}

export function lerContraste(v: string | undefined): Contraste {
  return v === "suave" || v === "alto" ? v : "auto";
}
