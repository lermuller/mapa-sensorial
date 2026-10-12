// Classificação de lugares do OpenStreetMap nas categorias e subtipos do site.
// Usada pelo importador (scripts/importar-osm.ts) e pela busca no Brasil todo (src/lib/externo.ts).

import type { Categoria } from "./estimulos";

/** Classifica um elemento na primeira categoria cujo filtro bate com as tags. */
export function categoriaDe(tags: Record<string, string>): Categoria | null {
  const t = (k: string) => tags[k] ?? "";
  if (t("shop") === "mall") return "shopping";
  if (t("shop") === "supermarket") return "supermercado";
  if (/^(hospital|clinic)$/.test(t("amenity")) || /^(hospital|clinic|laboratory)$/.test(t("healthcare")))
    return "saude";
  if (t("tourism") === "museum" || /^(cinema|theatre|arts_centre)$/.test(t("amenity"))) return "cultura";
  if (
    t("amenity") === "bus_station" ||
    (t("aeroway") === "aerodrome" && t("iata")) ||
    t("railway") === "station" ||
    t("public_transport") === "station"
  )
    return "transporte";
  if (
    /^(townhall|courthouse|police|post_office|social_facility)$/.test(t("amenity")) ||
    t("office") === "government"
  )
    return "servico_publico";
  if (/^(restaurant|cafe|fast_food|food_court)$/.test(t("amenity"))) return "restaurante_cafe";
  if (t("leisure") === "park" || t("place") === "square") return "parque_praca";
  return null;
}

/**
 * Subtipo do lugar, a partir das mesmas tags: permite buscar "cafés" sem misturar com
 * restaurantes. Os valores são os usados em src/lib/busca.ts.
 */
export function subtipoDe(tags: Record<string, string>, categoria: Categoria): string | null {
  const t = (k: string) => tags[k] ?? "";
  switch (categoria) {
    case "shopping":
      return "shopping";
    case "supermercado":
      return "supermercado";
    case "restaurante_cafe":
      return (
        { restaurant: "restaurante", cafe: "cafe", fast_food: "lanchonete", food_court: "praca_alimentacao" }[
          t("amenity")
        ] ?? null
      );
    case "parque_praca":
      return t("leisure") === "park" ? "parque" : "praca";
    case "saude":
      if (t("amenity") === "hospital" || t("healthcare") === "hospital") return "hospital";
      if (t("healthcare") === "laboratory") return "laboratorio";
      return "clinica";
    case "cultura":
      if (t("tourism") === "museum") return "museu";
      return { cinema: "cinema", theatre: "teatro", arts_centre: "centro_cultural" }[t("amenity")] ?? null;
    case "transporte":
      if (t("aeroway") === "aerodrome") return "aeroporto";
      if (t("amenity") === "bus_station") return "rodoviaria";
      return "estacao";
    case "servico_publico":
      if (t("office") === "government") return "orgao_publico";
      return (
        {
          townhall: "prefeitura",
          courthouse: "tribunal",
          police: "policia",
          post_office: "correios",
          social_facility: "assistencia_social",
        }[t("amenity")] ?? null
      );
    default:
      return null;
  }
}

/** Categoria e subtipo a partir das tags; null quando o lugar não é de nenhum tipo do site. */
export function classificar(tags: Record<string, string>): { categoria: Categoria; subtipo: string | null } | null {
  const categoria = categoriaDe(tags);
  return categoria ? { categoria, subtipo: subtipoDe(tags, categoria) } : null;
}
