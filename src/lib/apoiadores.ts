// Perfis e sites que apoiam o projeto (página Sobre, seção "Quem apoia").
// Para incluir alguém, adicione um item na lista. Só o nome é obrigatório.
// Logos ficam em src/assets/apoiadores/ (PNG com fundo transparente, até 800 px de largura).

import type { StaticImageData } from "next/image";
import triboNeurodiversa from "@/assets/apoiadores/tribo-neurodiversa.png";

export type RedeSocial = "instagram" | "linkedin" | "tiktok" | "youtube" | "facebook" | "x" | "threads" | "bluesky";

export const NOME_REDE: Record<RedeSocial, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  x: "X",
  threads: "Threads",
  bluesky: "Bluesky",
};

export type Apoiador = {
  nome: string;
  /** Uma frase sobre quem é (ex.: "Perfil sobre autismo na vida adulta"). */
  descricao?: string;
  /** Site principal, com https://. */
  site?: string;
  /** Links completos das redes, com https://. */
  redes?: Partial<Record<RedeSocial, string>>;
  /** Logo (import do arquivo em src/assets/apoiadores/). */
  logo?: StaticImageData;
};

export const APOIADORES: Apoiador[] = [
  {
    nome: "Tribo Neurodiversa",
    descricao:
      "Ecossistema de educação, suporte e pesquisa para adultos autistas, com conteúdos baseados em evidências e caminhos para viver com menos sofrimento e mais autenticidade.",
    site: "https://triboneurodiversa.lovable.app/",
    redes: {
      instagram: "https://www.instagram.com/triboneurodiversa",
      linkedin: "https://www.linkedin.com/in/lizamaral12to/",
      youtube: "https://www.youtube.com/@triboneurodiversa",
    },
    logo: triboNeurodiversa,
  },
];

/** Endereço do site sem "https://" e "www.", para mostrar. */
export function siteParaMostrar(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}
