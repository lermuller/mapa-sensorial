import "server-only";
import type { Categoria } from "./estimulos";
import { classificar } from "./osm";
import { criarClienteServidor } from "./supabase/server";

// Lugares do Brasil todo que ainda não estão na nossa base, a partir do OpenStreetMap:
// - Photon (photon.komoot.io): busca por texto, para completar os resultados;
// - Nominatim (nominatim.openstreetmap.org): confirma os dados de um lugar antes de gravá-lo.
// As consultas saem do nosso servidor: o IP de quem usa o site não vai para esses serviços.

const AGENTE = "mapa-sensorial/1.0 (https://www.mapasensorial.org; contato@mapasensorial.org)";
/** Retângulo do Brasil (oeste, sul, leste, norte). */
const BRASIL = "-74,-34,-34,6";

/** Tipos de lugar que pedimos ao Photon (os mesmos que o site classifica). */
const TAGS_PHOTON = [
  "amenity",
  "shop:mall",
  "shop:supermarket",
  "leisure:park",
  "place:square",
  "tourism:museum",
  "healthcare",
  "railway:station",
  "public_transport:station",
  "aeroway:aerodrome",
  "office:government",
];

const UF: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapa: "AP", amazonas: "AM", bahia: "BA", ceara: "CE",
  "distrito federal": "DF", "espirito santo": "ES", goias: "GO", maranhao: "MA",
  "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", para: "PA",
  paraiba: "PB", parana: "PR", pernambuco: "PE", piaui: "PI", "rio de janeiro": "RJ",
  "rio grande do norte": "RN", "rio grande do sul": "RS", rondonia: "RO", roraima: "RR",
  "santa catarina": "SC", "sao paulo": "SP", sergipe: "SE", tocantins: "TO",
};

function ufDoEstado(estado: string | undefined): string | null {
  if (!estado) return null;
  const chave = estado.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  return UF[chave] ?? null;
}

const TIPO_OSM: Record<string, string> = { N: "node", W: "way", R: "relation" };

export type LugarExterno = {
  /** "node/123", como em lugares.osm_id. */
  osmId: string;
  nome: string;
  categoria: Categoria;
  subtipo: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  lat: number;
  lng: number;
};

/** Tags no formato do importador; aeródromos do Photon não trazem o código IATA. */
function tagsDe(chave: string, valor: string): Record<string, string> {
  const tags: Record<string, string> = { [chave]: valor };
  if (chave === "aeroway" && valor === "aerodrome") tags.iata = "?";
  return tags;
}

type FeaturePhoton = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type?: string;
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    locality?: string;
    city?: string;
    state?: string;
    countrycode?: string;
  };
};

/**
 * Lugares do Brasil com esse texto, dos tipos que o site usa. Lista vazia se o serviço
 * falhar ou demorar: a busca segue só com a nossa base.
 */
export async function buscarForaDaBase(
  texto: string,
  perto?: { lat: number; lng: number },
): Promise<LugarExterno[]> {
  if (texto.trim().length < 3) return [];
  const u = new URL("https://photon.komoot.io/api/");
  u.searchParams.set("q", texto.slice(0, 100));
  u.searchParams.set("limit", "15");
  u.searchParams.set("bbox", BRASIL);
  if (perto) {
    u.searchParams.set("lat", String(perto.lat));
    u.searchParams.set("lon", String(perto.lng));
  }
  for (const t of TAGS_PHOTON) u.searchParams.append("osm_tag", t);
  try {
    const r = await fetch(u, {
      headers: { "User-Agent": AGENTE },
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 86_400 },
    });
    if (!r.ok) return [];
    const { features } = (await r.json()) as { features: FeaturePhoton[] };
    const vistos = new Set<string>();
    const lugares: LugarExterno[] = [];
    for (const f of features) {
      const p = f.properties;
      const tipo = TIPO_OSM[p.osm_type ?? ""];
      if (!tipo || !p.osm_id || !p.name || !p.osm_key || !p.osm_value || p.countrycode !== "BR") continue;
      const classe = classificar(tagsDe(p.osm_key, p.osm_value));
      if (!classe) continue;
      const osmId = `${tipo}/${p.osm_id}`;
      if (vistos.has(osmId)) continue;
      vistos.add(osmId);
      lugares.push({
        osmId,
        nome: p.name.slice(0, 200),
        ...classe,
        endereco: p.street ? `${p.street}${p.housenumber ? `, ${p.housenumber}` : ""}`.slice(0, 300) : null,
        bairro: (p.district ?? p.locality)?.slice(0, 100) ?? null,
        cidade: p.city?.slice(0, 100) ?? null,
        uf: ufDoEstado(p.state),
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
      });
    }
    return lugares;
  } catch {
    return [];
  }
}

type RespostaNominatim = {
  name?: string;
  lat: string;
  lon: string;
  category?: string;
  type?: string;
  address?: Record<string, string>;
};

/** Dados de um lugar do OpenStreetMap ("node/123"), confirmados no Nominatim. null se não existir ou não for do Brasil. */
export async function lugarDoOsm(osmId: string): Promise<LugarExterno | null> {
  const m = osmId.match(/^(node|way|relation)\/(\d{1,15})$/);
  if (!m) return null;
  const u = new URL("https://nominatim.openstreetmap.org/lookup");
  u.searchParams.set("osm_ids", `${m[1][0].toUpperCase()}${m[2]}`);
  u.searchParams.set("format", "jsonv2");
  u.searchParams.set("addressdetails", "1");
  u.searchParams.set("accept-language", "pt-BR");
  try {
    const r = await fetch(u, { headers: { "User-Agent": AGENTE }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const [l] = (await r.json()) as RespostaNominatim[];
    if (!l?.name || l.address?.country_code !== "br") return null;
    const a = l.address ?? {};
    const classe = (l.category && l.type && classificar(tagsDe(l.category, l.type))) || {
      categoria: "outros" as const,
      subtipo: null,
    };
    return {
      osmId,
      nome: l.name.slice(0, 200),
      ...classe,
      endereco: a.road ? `${a.road}${a.house_number ? `, ${a.house_number}` : ""}`.slice(0, 300) : null,
      bairro: (a.suburb ?? a.neighbourhood ?? a.quarter)?.slice(0, 100) ?? null,
      cidade: (a.city ?? a.town ?? a.village ?? a.municipality)?.slice(0, 100) ?? null,
      uf: a["ISO3166-2-lvl4"]?.replace(/^BR-/, "") ?? ufDoEstado(a.state),
      lat: Number(l.lat),
      lng: Number(l.lon),
    };
  } catch {
    return null;
  }
}

/** Cidade, estado e bairro de um ponto (para lugares adicionados pelas pessoas). */
export async function enderecoDoPonto(
  lat: number,
  lng: number,
): Promise<{ cidade: string | null; uf: string | null; bairro: string | null } | null> {
  const u = new URL("https://nominatim.openstreetmap.org/reverse");
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lon", String(lng));
  u.searchParams.set("format", "jsonv2");
  u.searchParams.set("zoom", "16");
  u.searchParams.set("accept-language", "pt-BR");
  try {
    const r = await fetch(u, { headers: { "User-Agent": AGENTE }, signal: AbortSignal.timeout(5000) });
    if (!r.ok) return null;
    const { address: a } = (await r.json()) as { address?: Record<string, string> };
    if (!a || a.country_code !== "br") return null;
    return {
      cidade: (a.city ?? a.town ?? a.village ?? a.municipality)?.slice(0, 100) ?? null,
      uf: a["ISO3166-2-lvl4"]?.replace(/^BR-/, "") ?? ufDoEstado(a.state),
      bairro: (a.suburb ?? a.neighbourhood ?? a.quarter)?.slice(0, 100) ?? null,
    };
  } catch {
    return null;
  }
}

export type Regiao = {
  nome: string;
  cidade: string | null;
  uf: string | null;
  tipo: "bairro" | "cidade";
  /** Retângulo da região, no formato da busca por área. */
  area: { sul: number; oeste: number; norte: number; leste: number };
};

const CHAVES_REGIAO = new Set(["place", "boundary"]);
const BAIRROS = new Set(["suburb", "neighbourhood", "quarter", "administrative"]);
const CIDADES = new Set(["city", "town", "municipality", "village"]);

type FeatureRegiao = FeaturePhoton & { properties: FeaturePhoton["properties"] & { extent?: number[] } };

/** Bairros e cidades do Brasil com esse nome (sugestões e busca por bairro). */
export async function buscarRegioes(
  texto: string,
  perto: { lat: number; lng: number } = { lat: -30.0346, lng: -51.2177 },
  limite = 5,
): Promise<Regiao[]> {
  if (texto.trim().length < 3) return [];
  const u = new URL("https://photon.komoot.io/api/");
  u.searchParams.set("q", texto.slice(0, 100));
  u.searchParams.set("limit", String(limite * 2));
  u.searchParams.set("bbox", BRASIL);
  u.searchParams.set("lat", String(perto.lat));
  u.searchParams.set("lon", String(perto.lng));
  for (const l of ["district", "locality", "city"]) u.searchParams.append("layer", l);
  try {
    const r = await fetch(u, {
      headers: { "User-Agent": AGENTE },
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 86_400 },
    });
    if (!r.ok) return [];
    const { features } = (await r.json()) as { features: FeatureRegiao[] };
    const regioes: Regiao[] = [];
    const vistas = new Set<string>();
    for (const f of features) {
      const p = f.properties;
      if (p.countrycode !== "BR" || !p.name || !CHAVES_REGIAO.has(p.osm_key ?? "")) continue;
      const tipo = CIDADES.has(p.osm_value ?? "") ? "cidade" : BAIRROS.has(p.osm_value ?? "") ? "bairro" : null;
      if (!tipo) continue;
      const cidade = tipo === "cidade" ? p.name : (p.city ?? null);
      const uf = ufDoEstado(p.state);
      const chave = `${p.name}|${cidade}|${uf}`;
      if (vistas.has(chave)) continue;
      vistas.add(chave);
      const [lng, lat] = f.geometry.coordinates;
      // extent do Photon: [oeste, norte, leste, sul]. Sem ele, um quadrado em volta do ponto.
      const e = p.extent;
      const raio = tipo === "cidade" ? 0.08 : 0.012;
      const area =
        e && e.length === 4
          ? { oeste: e[0], norte: e[1], leste: e[2], sul: e[3] }
          : { oeste: lng - raio, norte: lat + raio, leste: lng + raio, sul: lat - raio };
      regioes.push({ nome: p.name, cidade, uf, tipo, area });
      if (regioes.length >= limite) break;
    }
    return regioes;
  } catch {
    return [];
  }
}

function semAcento(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Cidade ou bairro com esse nome entre os lugares da base (função regiao_na_base). */
async function regiaoNaBase(texto: string): Promise<Regiao | null> {
  try {
    const supabase = await criarClienteServidor();
    const { data } = await supabase.rpc("regiao_na_base", { texto }).maybeSingle<{
      nome: string;
      cidade: string | null;
      uf: string | null;
      tipo: "bairro" | "cidade";
      sul: number;
      oeste: number;
      norte: number;
      leste: number;
    }>();
    if (!data) return null;
    const { sul, oeste, norte, leste, ...resto } = data;
    return { ...resto, area: { sul, oeste, norte, leste } };
  } catch {
    return null;
  }
}

/**
 * O texto é exatamente o nome de um bairro ou cidade ("Moinhos de Vento", "Batel Curitiba",
 * "bairro Bom Fim")? Só com nome exato, para não confundir com nomes de lugares.
 */
export async function regiaoExata(
  texto: string,
  perto?: { lat: number; lng: number },
): Promise<Regiao | null> {
  const procurado = semAcento(texto).replace(/^bairro\s+/, "");
  if (procurado.length < 3) return null;
  // Primeiro nas cidades e bairros dos lugares que já temos: rápido e não depende do Photon.
  const daBase = await regiaoNaBase(texto);
  if (daBase) return daBase;
  const regioes = await buscarRegioes(texto.replace(/^\s*bairro\s+/i, ""), perto);
  return (
    regioes.find((r) => {
      const nome = semAcento(r.nome);
      const cidade = semAcento(r.cidade ?? "");
      return (
        procurado === nome ||
        procurado === `${nome} ${cidade}` ||
        procurado === `${nome} ${cidade} ${semAcento(r.uf ?? "")}` ||
        procurado === `${nome} ${semAcento(r.uf ?? "")}`
      );
    }) ?? null
  );
}
