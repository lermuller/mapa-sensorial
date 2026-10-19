import type { OpcaoLugar } from "@/lib/avaliacoes";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/estimulos";
import { buscarForaDaBase } from "@/lib/externo";
import { localDoLugar } from "@/lib/formato";
import { criarClienteServidor } from "@/lib/supabase/server";

// Lugares para escolher numa linha da avaliação em lote (/avaliar): os da base primeiro,
// depois os do Brasil todo (OpenStreetMap) que ainda não estão nela.

type Linha = {
  id: string;
  nome: string;
  categoria: Categoria;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  osm_id: string | null;
};

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 2) return Response.json({ lugares: [] });
  const supabase = await criarClienteServidor();
  const [{ data }, fora] = await Promise.all([
    supabase.rpc("buscar_lugares", { termo: q, limite: 6 }),
    q.length >= 3 ? buscarForaDaBase(q) : Promise.resolve([]),
  ]);
  const locais = (data ?? []) as Linha[];
  const naBase = new Set(locais.map((l) => l.osm_id).filter(Boolean));
  const lugares: OpcaoLugar[] = [
    ...locais.map((l) => ({
      ref: `id:${l.id}`,
      nome: l.nome,
      detalhe: [ROTULO_CATEGORIA[l.categoria], localDoLugar(l)].filter(Boolean).join(" · "),
    })),
    ...fora
      .filter((e) => !naBase.has(e.osmId))
      .slice(0, 6)
      .map((e) => ({
        ref: `osm:${e.osmId}`,
        nome: e.nome,
        detalhe: [ROTULO_CATEGORIA[e.categoria], localDoLugar(e)].filter(Boolean).join(" · "),
      })),
  ];
  return Response.json({ lugares }, { headers: { "Cache-Control": "public, max-age=300" } });
}
