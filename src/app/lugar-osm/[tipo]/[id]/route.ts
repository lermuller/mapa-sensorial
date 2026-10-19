import { redirect } from "next/navigation";
import { garantirLugarDoOsm } from "@/lib/lugaresOsm";

// Abre um lugar do OpenStreetMap que veio da busca no Brasil todo. Na primeira vez, o lugar
// é gravado na base (garantirLugarDoOsm); depois, leva ao painel dele, mantendo a busca (?q=).
export async function GET(req: Request, ctx: { params: Promise<{ tipo: string; id: string }> }) {
  const { tipo, id } = await ctx.params;
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 100) ?? "";
  const lugarId = await garantirLugarDoOsm(`${tipo}/${id}`);
  // Não existe, arquivado ou fora do ar: volta para a busca.
  if (!lugarId) redirect(q ? `/?q=${encodeURIComponent(q)}&f=1` : "/");
  const u = new URLSearchParams();
  if (q) u.set("q", q);
  u.set("f", "1");
  u.set("lugar", lugarId);
  redirect(`/?${u.toString()}`);
}
