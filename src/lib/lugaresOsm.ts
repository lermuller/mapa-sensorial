import "server-only";
import { lugarDoOsm } from "./externo";
import { criarClienteAdmin } from "./supabase/admin";

/**
 * Id na nossa base de um lugar do OpenStreetMap ("node/123"). Na primeira vez, grava o lugar
 * com os dados confirmados no Nominatim (não confia no que vem do navegador).
 * null: não existe, não é do Brasil, ou foi arquivado/tirado do ar pela moderação.
 */
export async function garantirLugarDoOsm(osmId: string): Promise<string | null> {
  if (!/^(node|way|relation)\/\d{1,15}$/.test(osmId)) return null;
  const admin = criarClienteAdmin();
  const existente = await admin
    .from("lugares")
    .select("id, oculto, arquivado")
    .eq("osm_id", osmId)
    .maybeSingle();
  if (existente.data) return existente.data.oculto || existente.data.arquivado ? null : existente.data.id;

  const lugar = await lugarDoOsm(osmId);
  if (!lugar) return null;
  const { data } = await admin
    .from("lugares")
    .insert({
      nome: lugar.nome,
      categoria: lugar.categoria,
      subtipo: lugar.subtipo,
      endereco: lugar.endereco,
      bairro: lugar.bairro,
      cidade: lugar.cidade,
      uf: lugar.uf,
      lat: lugar.lat,
      lng: lugar.lng,
      origem: "osm",
      osm_id: osmId,
    })
    .select("id")
    .single();
  if (data) return data.id;
  // Outra pessoa gravou o mesmo lugar ao mesmo tempo.
  const denovo = await admin.from("lugares").select("id").eq("osm_id", osmId).maybeSingle();
  return denovo.data?.id ?? null;
}
