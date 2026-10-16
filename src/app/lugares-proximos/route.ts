import { ROTULO_CATEGORIA, type Categoria } from "@/lib/estimulos";
import { criarClienteServidor } from "@/lib/supabase/server";

// Lugares a até ~150 m de um ponto, para avisar "Já está no mapa?" ao adicionar um lugar.
export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lng = Number(u.searchParams.get("lng"));
  const ignorar = u.searchParams.get("ignorar") ?? "";
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Response.json({ lugares: [] });
  const dLat = 150 / 111_000;
  const dLng = 150 / (111_000 * Math.cos((lat * Math.PI) / 180));
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("lugares")
    .select("id, nome, categoria, lat, lng")
    .gte("lat", lat - dLat)
    .lte("lat", lat + dLat)
    .gte("lng", lng - dLng)
    .lte("lng", lng + dLng)
    .limit(30);
  const distancia = (l: { lat: number; lng: number }) =>
    Math.hypot((l.lat - lat) * 111_000, (l.lng - lng) * 111_000 * Math.cos((lat * Math.PI) / 180));
  const lugares = ((data ?? []) as { id: string; nome: string; categoria: Categoria; lat: number; lng: number }[])
    .filter((l) => l.id !== ignorar)
    .map((l) => ({ id: l.id, nome: l.nome, tipo: ROTULO_CATEGORIA[l.categoria], metros: Math.round(distancia(l)) }))
    .sort((a, b) => a.metros - b.metros)
    .slice(0, 5);
  return Response.json({ lugares });
}
