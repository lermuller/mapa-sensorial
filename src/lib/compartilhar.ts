import type { Metadata } from "next";
import type { Badge } from "./calculo";
import type { DetalheLugar } from "./dados";
import { ESTIMULOS, INFO_ESTIMULO, ROTULO_CATEGORIA, nivelNaFrase, type Estimulo } from "./estimulos";

/** "Som alto · Luz baixa · Cheiro médio", ou null se nenhum estímulo tem nível ainda. */
export function resumoNiveis(badges: Record<Estimulo, Badge | null>): string | null {
  const partes = ESTIMULOS.filter((e) => badges[e]).map(
    (e) => `${INFO_ESTIMULO[e].nome} ${nivelNaFrase(e, badges[e]!.nivel)}`,
  );
  return partes.length > 0 ? partes.join(" · ") : null;
}

/** Texto que acompanha o link ao compartilhar um lugar. */
export function textoCompartilhar(detalhe: Pick<DetalheLugar, "lugar" | "badges">): string {
  const niveis = resumoNiveis(detalhe.badges);
  return niveis
    ? `Como é lá? ${detalhe.lugar.nome}: ${niveis}. Veja antes de ir no Mapa Sensorial.`
    : `Como é lá? Ainda ninguém contou como é ${detalhe.lugar.nome}. Conta lá no Mapa Sensorial?`;
}

/** Endereço público de um lugar: abre o painel dele sobre o mapa. */
export function caminhoLugar(id: string): string {
  return `/?lugar=${id}`;
}

/** Título, descrição e prévia (Open Graph) de um lugar. */
export function metadadosDoLugar(detalhe: DetalheLugar): Metadata {
  const { lugar } = detalhe;
  const titulo = `${lugar.nome}: como é lá?`;
  const niveis = resumoNiveis(detalhe.badges);
  const local = [lugar.bairro, lugar.cidade && (lugar.uf ? `${lugar.cidade}/${lugar.uf}` : lugar.cidade)]
    .filter(Boolean)
    .join(" · ");
  const descricao = `${ROTULO_CATEGORIA[lugar.categoria]}${local ? ` · ${local}` : ""}. ${
    niveis ? `${niveis}.` : "Ainda sem relatos."
  } Relatos da comunidade sobre som, luz, cheiro, lotação, visual e temperatura.`;
  const imagem = {
    url: `/og/lugar/${lugar.id}`,
    width: 1200,
    height: 630,
    alt: `Como é lá: ${lugar.nome}`,
  };
  return {
    title: lugar.nome,
    description: descricao,
    // Um só endereço para o lugar, mesmo vindo de /lugar/[id] ou com filtros na URL.
    alternates: { canonical: caminhoLugar(lugar.id) },
    openGraph: {
      title: titulo,
      description: descricao,
      url: caminhoLugar(lugar.id),
      siteName: "Mapa Sensorial",
      locale: "pt_BR",
      type: "website",
      images: [imagem],
    },
    twitter: { card: "summary_large_image", title: titulo, description: descricao, images: [imagem] },
  };
}
