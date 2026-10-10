// Avatares: variações dos rostos padrão da identidade visual (forma, rosto e cor).
// Guardado como "forma:rosto:cor" (ver migração avatar).

import type { FormaPadrao, Rosto } from "@/components/Personagem";

export type CorAvatar = "verde" | "lilas" | "amarelo" | "rosa" | "laranja" | "azul";

export const COR_AVATAR: Record<CorAvatar, string> = {
  verde: "var(--verde)",
  lilas: "var(--c-som)",
  amarelo: "var(--c-luz)",
  rosa: "var(--c-cheiro)",
  laranja: "var(--c-lotacao)",
  azul: "var(--c-visual)",
};

export type Avatar = { forma: FormaPadrao; rosto: Rosto; cor: CorAvatar };

export const AVATAR_PADRAO = "bolha:feliz:verde";

/** Opções oferecidas na conta. */
export const AVATARES = [
  "bolha:feliz:verde",
  "bloco:piscando:lilas",
  "octogono:curioso:amarelo",
  "triangulo:calmo:rosa",
  "bolha:calmo:laranja",
  "bloco:feliz:azul",
  "octogono:feliz:verde",
  "triangulo:piscando:amarelo",
] as const;

const FORMAS = ["bolha", "bloco", "triangulo", "octogono"];
const ROSTOS = ["feliz", "calmo", "curioso", "piscando"];

export function lerAvatar(valor: string | null | undefined): Avatar {
  const [forma, rosto, cor] = (valor ?? AVATAR_PADRAO).split(":");
  if (FORMAS.includes(forma) && ROSTOS.includes(rosto) && cor in COR_AVATAR) {
    return { forma: forma as FormaPadrao, rosto: rosto as Rosto, cor: cor as CorAvatar };
  }
  return lerAvatar(AVATAR_PADRAO);
}

export function avatarValido(valor: string): boolean {
  return (AVATARES as readonly string[]).includes(valor);
}
