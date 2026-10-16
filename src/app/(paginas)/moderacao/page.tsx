import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeSensorial } from "@/components/BadgeSensorial";
import { arquivarLugar, manterLugar } from "@/lib/acoes/lugares";
import { ehModeradora, manterRelato, removerRelato } from "@/lib/acoes/moderacao";
import type { RelatoLinha } from "@/lib/dados";
import { ESTIMULOS, NIVEIS } from "@/lib/estimulos";
import { formatarData } from "@/lib/formato";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { VoltarAoMapa } from "@/components/LinkSeta";

export const metadata: Metadata = { title: "Moderação" };

const ROTULO_MOTIVO = {
  nao_existe: "Não existe ou fechou",
  local_errado: "Local errado no mapa",
  nome_errado: "Nome ou tipo errado",
  duplicado: "Repetido",
  ofensivo: "Ofensivo ou propaganda",
  outro: "Outro",
} as const;

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

  // Lugares com problemas informados (abertos), com os motivos agrupados.
  const { data: problemas } = await admin
    .from("problemas_lugares")
    .select("id, lugar_id, motivo, detalhe, criado_em, lugares(id, nome, cidade, uf, oculto, arquivado, talvez_fechado, origem)")
    .eq("resolvido", false)
    .order("criado_em", { ascending: false });
  type Problema = {
    id: string;
    lugar_id: string;
    motivo: keyof typeof ROTULO_MOTIVO;
    detalhe: string | null;
    criado_em: string;
    lugares: {
      id: string;
      nome: string;
      cidade: string | null;
      uf: string | null;
      oculto: boolean;
      arquivado: boolean;
      talvez_fechado: boolean;
      origem: string;
    } | null;
  };
  const porLugar = new Map<string, Problema[]>();
  for (const pr of (problemas ?? []) as unknown as Problema[]) {
    porLugar.set(pr.lugar_id, [...(porLugar.get(pr.lugar_id) ?? []), pr]);
  }
  const lugaresComProblema = [...porLugar.values()].sort((a, b) => b.length - a.length);

  return (
    <div className="space-y-6">
      <VoltarAoMapa />
      <header className="space-y-1">
        <h1 className="display text-3xl">Moderação</h1>
        <nav aria-label="Nesta página" className="flex flex-wrap gap-1.5 pt-1">
          <a href="#relatos" className="chip font-medium">
            Relatos ({itens.length})
          </a>
          <a href="#lugares" className="chip font-medium">
            Lugares ({lugaresComProblema.length})
          </a>
        </nav>
        <p className="text-sm text-texto-suave">
          Relatos com denúncias abertas. Com denúncias de 2 pessoas, o relato sai do ar até alguém
          decidir aqui.
        </p>
      </header>

      <h2 id="relatos" className="scroll-mt-24 text-xl">
        Relatos denunciados
      </h2>
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

      <section aria-labelledby="lugares" className="space-y-3">
        <h2 id="lugares" className="scroll-mt-24 text-xl">
          Lugares com problemas informados
        </h2>
        <p className="text-sm text-texto-suave">
          Ofensivo: 2 pessoas tiram do ar. Não existe ou fechou: 3 pessoas mostram o aviso “Pode ter
          fechado”. Arquivar esconde o lugar sem apagar.
        </p>
        {lugaresComProblema.length === 0 ? (
          <p className="cartao">Nenhum problema informado em lugares.</p>
        ) : (
          <ol className="space-y-3">
            {lugaresComProblema.map((lista) => {
              const l = lista[0].lugares;
              if (!l) return null;
              const estado = l.arquivado
                ? "Arquivado"
                : l.oculto
                  ? "Fora do ar"
                  : l.talvez_fechado
                    ? "Com aviso “Pode ter fechado”"
                    : "No ar";
              return (
                <li key={l.id} className="cartao space-y-3 bg-fundo text-sm">
                  <header className="flex flex-wrap items-baseline justify-between gap-2">
                    <p>
                      <a href={`/?lugar=${l.id}`} className="font-bold">
                        {l.nome}
                      </a>
                      {l.cidade && ` · ${l.cidade}${l.uf ? `/${l.uf}` : ""}`} ·{" "}
                      {l.origem === "usuario" ? "adicionado por uma pessoa" : "OpenStreetMap"}
                    </p>
                    <span className={l.oculto || l.arquivado ? "font-bold text-[var(--erro-texto)]" : "text-texto-suave"}>
                      {estado} · {lista.length} {lista.length === 1 ? "aviso" : "avisos"}
                    </span>
                  </header>
                  <ul className="space-y-1 rounded-2xl bg-superficie p-3">
                    {lista.map((pr) => (
                      <li key={pr.id}>
                        <strong>{ROTULO_MOTIVO[pr.motivo]}</strong>
                        {pr.detalhe && <> · “{pr.detalhe}”</>}{" "}
                        <span className="text-texto-suave">· {formatarData(pr.criado_em)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <a href={`/lugar/${l.id}/editar`} className="botao-terciario">
                      Corrigir lugar
                    </a>
                    <form action={arquivarLugar.bind(null, l.id)}>
                      <button type="submit" className="botao botao-perigo">
                        Arquivar
                      </button>
                    </form>
                    <form action={manterLugar.bind(null, l.id)}>
                      <button type="submit" className="botao">
                        Manter
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
