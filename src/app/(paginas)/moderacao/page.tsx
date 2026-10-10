import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeSensorial } from "@/components/BadgeSensorial";
import { ehModeradora, manterRelato, removerRelato } from "@/lib/acoes/moderacao";
import type { RelatoLinha } from "@/lib/dados";
import { ESTIMULOS, NIVEIS } from "@/lib/estimulos";
import { formatarData } from "@/lib/formato";
import { criarClienteAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Moderação" };

type Denuncia = { id: string; relato_id: string; motivo: string; criado_em: string };

/** Relatos com denúncias abertas. Só para moderadores (tabela moderadores). */
export default async function PaginaModeracao() {
  if (!(await ehModeradora())) notFound();

  const admin = criarClienteAdmin();
  const { data: denuncias } = await admin
    .from("denuncias")
    .select("id, relato_id, motivo, criado_em")
    .eq("resolvida", false)
    .order("criado_em", { ascending: false });
  const porRelato = new Map<string, Denuncia[]>();
  for (const d of (denuncias ?? []) as Denuncia[]) {
    porRelato.set(d.relato_id, [...(porRelato.get(d.relato_id) ?? []), d]);
  }
  const ids = [...porRelato.keys()];
  const { data: relatos } = ids.length
    ? await admin.from("relatos").select("*, lugares(nome), usuarios(nome_publico)").in("id", ids)
    : { data: [] };

  type Item = RelatoLinha & {
    lugares: { nome: string } | null;
    usuarios: { nome_publico: string } | null;
  };
  const itens = ((relatos ?? []) as Item[]).sort(
    (a, b) => (porRelato.get(b.id)?.length ?? 0) - (porRelato.get(a.id)?.length ?? 0),
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="display text-3xl">Moderação</h1>
        <p className="text-sm text-texto-suave">
          Relatos com denúncias abertas. Com denúncias de 2 pessoas, o relato sai do ar até alguém
          decidir aqui.
        </p>
      </header>

      {itens.length === 0 ? (
        <p className="cartao">Nenhuma denúncia aberta. Tudo tranquilo por aqui.</p>
      ) : (
        <ol className="space-y-3">
          {itens.map((r) => {
            const lista = porRelato.get(r.id) ?? [];
            return (
              <li key={r.id} className="cartao space-y-3 bg-fundo text-sm">
                <header className="flex flex-wrap items-baseline justify-between gap-2">
                  <p>
                    <strong>{r.lugares?.nome}</strong> · por {r.usuarios?.nome_publico} ·{" "}
                    {formatarData(r.criado_em)}
                  </p>
                  <span className={r.oculto ? "font-bold text-[var(--erro-texto)]" : "text-texto-suave"}>
                    {r.oculto ? "Fora do ar" : "No ar"} · {lista.length}{" "}
                    {lista.length === 1 ? "denúncia" : "denúncias"}
                  </span>
                </header>
                <ul className="flex flex-wrap gap-1">
                  {ESTIMULOS.filter((e) => r[e] !== null).map((e) => (
                    <li key={e}>
                      <BadgeSensorial
                        compacto
                        badge={{ estimulo: e, nivel: NIVEIS[r[e]!], media: r[e]!, total: 1, poucosRelatos: false }}
                      />
                    </li>
                  ))}
                </ul>
                {r.o_que_esperar && <p className="whitespace-pre-line">“{r.o_que_esperar}”</p>}
                {r.comentario && <p className="whitespace-pre-line">“{r.comentario}”</p>}
                <div className="space-y-1 rounded-2xl bg-superficie p-3">
                  <p className="font-bold">Motivos</p>
                  <ul className="list-disc pl-5">
                    {lista.map((d) => (
                      <li key={d.id}>{d.motivo}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <form action={removerRelato.bind(null, r.id)}>
                    <button type="submit" className="botao botao-perigo">
                      Remover relato
                    </button>
                  </form>
                  <form action={manterRelato.bind(null, r.id)}>
                    <button type="submit" className="botao">
                      Manter relato
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
