import { redirect } from "next/navigation";
import { lugarDoOsm } from "@/lib/externo";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Abre um lugar do OpenStreetMap que veio da busca no Brasil todo. Na primeira vez, grava o
// lugar na base com os dados confirmados no Nominatim (não confiamos no que vem da URL);
// depois, leva ao painel dele na página inicial, mantendo a busca (?q=).
export async function GET(req: Request, ctx: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await ctx.params;
  const osmId = `${tipo}/${id}`;
  if (!/^(node|way|relation)\/\d{1,15}$/.test(osmId)) redirect("/");
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 100) ?? "";
  const destino = (lugarId: string) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    u.set("f", "1");
    u.set("lugar", lugarId);
    return `/?${u.toString()}`;
  };

  const admin = criarClienteAdmin();
  const existente = await admin
    .from("lugares")
    .select("id, oculto, arquivado")
    .eq("osm_id", osmId)
    .maybeSingle();
  if (existente.data) {
    // Arquivado ou fora do ar pela moderação: não reabre; volta para a busca.
    if (existente.data.oculto || existente.data.arquivado) redirect(q ? `/?q=${encodeURIComponent(q)}&f=1` : "/");
    redirect(destino(existente.data.id));
  }

  const lugar = await lugarDoOsm(osmId);
  if (!lugar) redirect(q ? `/?q=${encodeURIComponent(q)}&f=1` : "/");

  const { data, error } = await admin
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
  if (data) redirect(destino(data.id));
  // Outra pessoa abriu o mesmo lugar ao mesmo tempo: ele já existe.
  const denovo = await admin.from("lugares").select("id").eq("osm_id", osmId).maybeSingle();
  if (denovo.data) redirect(destino(denovo.data.id));
  console.error("Não foi possível gravar o lugar do OSM", osmId, error);
  redirect("/");
}
