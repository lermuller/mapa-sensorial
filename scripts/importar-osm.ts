/**
 * Importa a base inicial de lugares de Porto Alegre do OpenStreetMap (via Overpass).
 *
 *   npm run importar-osm -- --simular                  # só mostra o que seria importado
 *   npm run importar-osm                               # grava no Supabase (precisa de SUPABASE_SECRET_KEY)
 *   npm run importar-osm -- --categorias=saude,cultura # só algumas categorias
 *
 * Pode ser rodado de novo: atualiza os lugares pelo osm_id, sem duplicar.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Categoria } from "../src/lib/estimulos";
import { categoriaDe, subtipoDe } from "../src/lib/osm";

const OVERPASS = process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";

// Filtros do Overpass para cada categoria do MVP. "outros" não é importada.
const FILTROS: Record<Exclude<Categoria, "outros">, string[]> = {
  shopping: ['["shop"="mall"]'],
  supermercado: ['["shop"="supermarket"]'],
  restaurante_cafe: ['["amenity"~"^(restaurant|cafe|fast_food|food_court)$"]'],
  parque_praca: ['["leisure"="park"]', '["place"="square"]'],
  saude: ['["amenity"~"^(hospital|clinic)$"]', '["healthcare"~"^(hospital|clinic|laboratory)$"]'],
  cultura: ['["tourism"="museum"]', '["amenity"~"^(cinema|theatre|arts_centre)$"]'],
  transporte: [
    '["amenity"="bus_station"]',
    '["aeroway"="aerodrome"]["iata"]',
    '["railway"="station"]',
    '["public_transport"="station"]',
  ],
  servico_publico: [
    '["amenity"~"^(townhall|courthouse|police|post_office|social_facility)$"]',
    '["office"="government"]',
  ],
};

type ElementoOsm = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function montarConsulta(filtros: string[]): string {
  const partes = filtros
    .map((f) => `nwr${f}["name"](area.poa);`)
    .join("\n  ");
  return `[out:json][timeout:120];
area["name"="Porto Alegre"]["boundary"="administrative"]["admin_level"="8"]->.poa;
(
  ${partes}
);
out center tags;`;
}

function endereco(tags: Record<string, string>): string | null {
  const rua = tags["addr:street"];
  if (!rua) return null;
  return tags["addr:housenumber"] ? `${rua}, ${tags["addr:housenumber"]}` : rua;
}

async function consultar(filtros: string[]): Promise<ElementoOsm[]> {
  const resposta = await fetch(OVERPASS, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "mapa-sensorial/0.1 (importação inicial)",
    },
    body: new URLSearchParams({ data: montarConsulta(filtros) }),
  });
  if (!resposta.ok) {
    throw new Error(`Overpass respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 300)}`);
  }
  const json = (await resposta.json()) as { elements: ElementoOsm[]; remark?: string };
  // Quando sobrecarregado, o Overpass responde 200 com o erro em "remark".
  if (json.remark && json.elements.length === 0) throw new Error(`Overpass: ${json.remark}`);
  return json.elements;
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Consulta uma categoria com novas tentativas. null = desistiu. */
async function buscarCategoria(categoria: string, filtros: string[]): Promise<ElementoOsm[] | null> {
  for (let tentativa = 1; tentativa <= 6; tentativa++) {
    try {
      return await consultar(filtros);
    } catch (e) {
      console.log(`  ${categoria}: falhou (${(e as Error).message.slice(0, 60)}), tentativa ${tentativa} de 6`);
      if (tentativa < 6) await espera(20_000 * tentativa);
    }
  }
  return null;
}

function paraLugar(e: ElementoOsm) {
  const tags = e.tags ?? {};
  const lat = e.lat ?? e.center?.lat;
  const lng = e.lon ?? e.center?.lon;
  const categoria = categoriaDe(tags);
  if (!tags.name || lat === undefined || lng === undefined || !categoria) return null;
  return {
    nome: tags.name.slice(0, 200),
    categoria,
    subtipo: subtipoDe(tags, categoria),
    // A consulta é da área de Porto Alegre (montarConsulta).
    cidade: "Porto Alegre",
    uf: "RS",
    endereco: endereco(tags)?.slice(0, 300) ?? null,
    bairro: (tags["addr:suburb"] ?? tags["addr:neighbourhood"])?.slice(0, 100) ?? null,
    lat,
    lng,
    origem: "osm" as const,
    osm_id: `${e.type}/${e.id}`,
  };
}

function lerCategoriasEscolhidas(): string[] {
  const arg = process.argv.find((a) => a.startsWith("--categorias="));
  const todas = Object.keys(FILTROS);
  if (!arg) return todas;
  const escolhidas = arg.slice("--categorias=".length).split(",").filter(Boolean);
  const invalidas = escolhidas.filter((c) => !todas.includes(c));
  if (invalidas.length) throw new Error(`Categorias desconhecidas: ${invalidas.join(", ")}. Use: ${todas.join(", ")}`);
  return escolhidas;
}

/**
 * Busca e grava uma categoria por vez: se o Overpass falhar numa,
 * as outras já ficam salvas. As que falharem podem ser repetidas com --categorias=.
 */
async function main() {
  const simular = process.argv.includes("--simular");
  const categorias = lerCategoriasEscolhidas();

  let supabase: SupabaseClient | null = null;
  if (!simular) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const chave = process.env.SUPABASE_SECRET_KEY;
    if (!url || !chave) {
      throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ver .env.example).");
    }
    supabase = createClient(url, chave, { auth: { persistSession: false } });
  }

  const falharam: string[] = [];
  let total = 0;
  for (const categoria of categorias) {
    console.log(`Buscando ${categoria}…`);
    const elementos = await buscarCategoria(categoria, FILTROS[categoria as keyof typeof FILTROS]);
    if (!elementos) {
      falharam.push(categoria);
      continue;
    }
    const lugares = elementos.map(paraLugar).filter((l) => l !== null);
    total += lugares.length;
    if (simular) {
      console.log(`  ${categoria}: ${lugares.length} lugares. Exemplo:`, lugares[0]);
    } else {
      for (let i = 0; i < lugares.length; i += 500) {
        const { error } = await supabase!.from("lugares").upsert(lugares.slice(i, i + 500), { onConflict: "osm_id" });
        if (error) throw error;
      }
      console.log(`  ${categoria}: ${lugares.length} lugares gravados`);
    }
    await espera(2_000);
  }

  console.log(`${simular ? "Encontrados" : "Gravados"} ${total} lugares.`);
  if (falharam.length) {
    console.log(`O Overpass falhou em: ${falharam.join(", ")}. Para tentar só essas de novo:`);
    console.log(`  npm run importar-osm -- --categorias=${falharam.join(",")}`);
    process.exitCode = 2;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
