import { interpretarBusca, sugerirTipo, type Sugestao } from "@/lib/busca";
import { ROTULO_CATEGORIA, type Categoria } from "@/lib/estimulos";
import { buscarRegioes } from "@/lib/externo";
import { localDoLugar } from "@/lib/formato";
import { criarClienteServidor } from "@/lib/supabase/server";

// Sugestões enquanto a pessoa digita na busca: tipo de lugar, lugares da base e bairros/cidades.

const sobreLugar = (q: string) => `/?q=${encodeURIComponent(q)}&f=1`;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const perto = Number.isFinite(lat) && Number.isFinite(lng) && lat && lng ? { lat, lng } : undefined;
  if (q.length < 2) return Response.json({ sugestoes: [] });

  const supabase = await criarClienteServidor();
  const [lugares, regioes] = await Promise.all([
    supabase
      .rpc("buscar_lugares", { termo: q, limite: 5 })
      .then(({ data }) => (data ?? []) as {
        id: string;
        nome: string;
        categoria: Categoria;
        endereco: string | null;
        bairro: string | null;
        cidade: string | null;
        uf: string | null;
      }[]),
    buscarRegioes(q, perto, 3),
  ]);

  const sugestoes: Sugestao[] = [];

  // Tipo de lugar: "café no Bom Fim" ou só o começo ("caf" → cafés).
  const { tipo, termo } = interpretarBusca(q);
  const tipoSugerido = tipo ? { consulta: q, rotulo: tipo.rotulo } : sugerirTipo(q);
  if (tipoSugerido) {
    const onde = tipo && termo ? ` em “${termo}”` : "";
    sugestoes.push({
      tipo: "tipo",
      rotulo: `${tipoSugerido.rotulo[0].toUpperCase()}${tipoSugerido.rotulo.slice(1)}${onde}`,
      detalhe: "Tipo de lugar",
      href: sobreLugar(tipoSugerido.consulta),
    });
  }

  for (const l of lugares) {
    sugestoes.push({
      tipo: "lugar",
      rotulo: l.nome,
      detalhe: [ROTULO_CATEGORIA[l.categoria], localDoLugar(l)].filter(Boolean).join(" · "),
      href: `/?lugar=${l.id}`,
    });
  }

  for (const r of regioes) {
    // Cidade e estado na busca, para a região certa (há bairros e cidades com o mesmo nome).
    const consulta =
      r.tipo === "bairro" && r.cidade ? `${r.nome} ${r.cidade}` : r.uf ? `${r.nome} ${r.uf}` : r.nome;
    if (sugestoes.some((s) => s.href === sobreLugar(consulta))) continue;
    sugestoes.push({
      tipo: "regiao",
      rotulo: r.nome,
      detalhe:
        r.tipo === "bairro"
          ? `Bairro · ${[r.cidade, r.uf].filter(Boolean).join("/")}`
          : `Cidade${r.uf ? ` · ${r.uf}` : ""}`,
      href: sobreLugar(consulta),
    });
  }

  return Response.json(
    { sugestoes },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
