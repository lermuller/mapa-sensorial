"use client";

import Link from "next/link";
import { useState, useTransition, type ChangeEvent } from "react";
import { salvarAvaliacoes } from "@/lib/acoes/avaliacoes";
import {
  MAXIMO_POR_ENVIO,
  lerPlanilha,
  niveisVazios,
  type LinhaAvaliacao,
  type OpcaoLugar,
  type Quando,
  type ValorNivel,
} from "@/lib/avaliacoes";
import { ESTIMULOS, INFO_ESTIMULO, NIVEIS, rotuloNivel, type Estimulo } from "@/lib/estimulos";
import { EscolherLugar } from "./EscolherLugar";

type Linha = {
  uid: number;
  lugar: OpcaoLugar | null;
  /** Texto da planilha para encontrar o lugar. */
  busca: string;
  /** Lugar escolhido automaticamente pela planilha: a pessoa deve conferir. */
  conferir: boolean;
  niveis: Record<Estimulo, ValorNivel>;
  quando: Quando;
  data: string;
  erro?: string;
};

const QUANDO: { valor: Quando; rotulo: string }[] = [
  { valor: "sempre", rotulo: "É sempre assim" },
  { valor: "manha", rotulo: "De manhã" },
  { valor: "tarde", rotulo: "À tarde" },
  { valor: "noite", rotulo: "À noite" },
];

let proximoUid = 1;

function linhaVazia(hoje: string, parcial: Partial<Linha> = {}): Linha {
  return {
    uid: proximoUid++,
    lugar: null,
    busca: "",
    conferir: false,
    niveis: niveisVazios(),
    quando: "sempre",
    data: hoje,
    ...parcial,
  };
}

/** Avaliar vários lugares de uma vez: uma linha por lugar, só os níveis dos estímulos. */
export function TabelaAvaliacoes({ hoje }: { hoje: string }) {
  const [linhas, setLinhas] = useState<Linha[]>(() => [linhaVazia(hoje)]);
  const [salvando, iniciarSalvamento] = useTransition();
  const [resumo, setResumo] = useState("");
  const [planilha, setPlanilha] = useState("");

  const mudar = (uid: number, parcial: Partial<Linha>) =>
    setLinhas((ls) => ls.map((l) => (l.uid === uid ? { ...l, ...parcial, erro: undefined } : l)));

  const prontas = linhas.filter((l) => l.lugar && ESTIMULOS.some((e) => l.niveis[e]));

  /** Lê a planilha, cria as linhas e procura cada lugar pelo nome (a pessoa confere). */
  async function subirPlanilha(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    const { linhas: lidas, ignoradas, erro } = lerPlanilha(await arquivo.text());
    if (lidas.length === 0) {
      setPlanilha(erro ?? "Nenhum lugar avaliado na planilha. Preencha os níveis dos lugares que você conhece.");
      return;
    }
    const novas = lidas.map((l) =>
      linhaVazia(hoje, { busca: l.busca, niveis: l.niveis, quando: l.quando, data: l.data || hoje }),
    );
    // Linhas vazias de antes saem; as novas entram no lugar.
    setLinhas((ls) => [...ls.filter((l) => l.lugar || ESTIMULOS.some((x) => l.niveis[x])), ...novas]);
    for (const [i, nova] of novas.entries()) {
      setPlanilha(`Encontrando os lugares da planilha… ${i + 1} de ${novas.length}`);
      try {
        const r = await fetch(`/buscar-lugar?q=${encodeURIComponent(nova.busca)}`);
        const { lugares } = (await r.json()) as { lugares: OpcaoLugar[] };
        if (lugares[0]) mudar(nova.uid, { lugar: lugares[0], conferir: true });
      } catch {
        // Fica sem lugar: a pessoa escolhe na linha.
      }
    }
    setPlanilha(
      `${novas.length} ${novas.length === 1 ? "lugar avaliado lido" : "lugares avaliados lidos"} da planilha${
        ignoradas > 0 ? ` (${ignoradas} sem avaliação ficaram de fora)` : ""
      }. Confira o lugar de cada um antes de salvar.${erro ? ` ${erro}` : ""}`,
    );
  }

  function salvar() {
    const envio = prontas.slice(0, MAXIMO_POR_ENVIO);
    const dados: LinhaAvaliacao[] = envio.map((l) => ({
      ref: l.lugar!.ref,
      niveis: l.niveis,
      quando: l.quando,
      data: l.data,
    }));
    iniciarSalvamento(async () => {
      const resultados = await salvarAvaliacoes(dados);
      const salvas = new Set(envio.filter((_, i) => resultados[i]?.ok).map((l) => l.uid));
      const erros = new Map(
        envio.flatMap((l, i) => {
          const r = resultados[i];
          return r && !r.ok ? [[l.uid, r.erro] as const] : [];
        }),
      );
      setLinhas((ls) => {
        const restantes = ls.filter((l) => !salvas.has(l.uid)).map((l) => ({ ...l, erro: erros.get(l.uid) }));
        return restantes.length > 0 ? restantes : [linhaVazia(hoje)];
      });
      setResumo(
        `${salvas.size} ${salvas.size === 1 ? "avaliação salva" : "avaliações salvas"}.` +
          (erros.size > 0 ? ` ${erros.size} ${erros.size === 1 ? "linha precisa" : "linhas precisam"} de ajuste (veja abaixo).` : " Obrigado!"),
      );
    });
  }

  return (
    <div className="space-y-6">
      {/* Planilha: para quem prefere preencher no computador */}
      <section aria-labelledby="titulo-planilha" className="cartao space-y-2">
        <h2 id="titulo-planilha" className="text-lg">
          Prefere planilha?
        </h2>
        <p className="text-sm">
          Baixe o modelo, preencha no Excel ou no Google Planilhas (uma linha por lugar) e suba o
          arquivo em CSV. As linhas aparecem aqui embaixo para você conferir antes de salvar.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/avaliar/modelo" download className="botao botao-secundario">
            Baixar modelo
          </a>
          <label className="botao botao-secundario cursor-pointer">
            Subir planilha (.csv)
            <input type="file" accept=".csv,text/csv" onChange={subirPlanilha} className="sr-only" />
          </label>
        </div>
        <p role="status" className="text-sm font-bold">
          {planilha}
        </p>
      </section>

      <div role="status">{resumo && <p className="sucesso">{resumo}</p>}</div>

      <ol className="space-y-3">
        {linhas.map((l, i) => (
          <li key={l.uid} className="cartao space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base">Lugar {i + 1}</h3>
              {linhas.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLinhas((ls) => ls.filter((x) => x.uid !== l.uid))}
                  className="botao-terciario text-sm"
                  aria-label={`Remover o lugar ${i + 1}`}
                >
                  Remover
                </button>
              )}
            </div>

            <EscolherLugar
              rotulo={`Lugar ${i + 1}`}
              escolhido={l.lugar}
              textoInicial={l.busca}
              aoEscolher={(o) => mudar(l.uid, { lugar: o, conferir: false })}
            />
            {l.conferir && <p className="text-sm font-bold">Confira se é este o lugar da planilha: “{l.busca}”.</p>}

            <fieldset>
              <legend className="sr-only">Como estava em Lugar {i + 1}</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ESTIMULOS.map((e) => (
                  <label key={e} className="block text-sm">
                    <span className="mb-1 block font-bold">{INFO_ESTIMULO[e].nome}</span>
                    <select
                      value={l.niveis[e]}
                      onChange={(ev) => mudar(l.uid, { niveis: { ...l.niveis, [e]: ev.target.value as ValorNivel } })}
                      className="campo"
                    >
                      <option value="">Não reparei</option>
                      {NIVEIS.map((n, k) => (
                        <option key={n} value={String(k)}>
                          {rotuloNivel(e, n)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                <span className="mb-1 block font-bold">Quando</span>
                <select
                  value={l.quando}
                  onChange={(ev) => mudar(l.uid, { quando: ev.target.value as Quando })}
                  className="campo"
                >
                  {QUANDO.map((q) => (
                    <option key={q.valor} value={q.valor}>
                      {q.rotulo}
                    </option>
                  ))}
                </select>
              </label>
              {l.quando !== "sempre" && (
                <label className="block min-w-0 text-sm">
                  <span className="mb-1 block font-bold">Dia da visita</span>
                  <input
                    type="date"
                    max={hoje}
                    value={l.data}
                    onChange={(ev) => mudar(l.uid, { data: ev.target.value })}
                    className="campo campo-data"
                  />
                </label>
              )}
            </div>

            {l.erro && (
              <p role="alert" className="erro text-sm">
                {l.erro}
              </p>
            )}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setLinhas((ls) => [...ls, linhaVazia(hoje)])}
          disabled={linhas.length >= MAXIMO_POR_ENVIO}
          className="botao botao-secundario"
        >
          Adicionar outro lugar
        </button>
        <button type="button" onClick={salvar} disabled={salvando || prontas.length === 0} className="botao">
          {salvando
            ? "Salvando…"
            : prontas.length === 0
              ? "Salvar avaliações"
              : `Salvar ${prontas.length} ${prontas.length === 1 ? "avaliação" : "avaliações"}`}
        </button>
      </div>
      <p className="ajuda">
        Só entram as linhas com lugar escolhido e pelo menos um estímulo. Cada lugar pode ser avaliado
        uma vez por dia, até 100 avaliações por dia. Para contar detalhes do lugar, use “Contar como
        é lá” na <Link href="/">página do lugar</Link>.
      </p>
    </div>
  );
}
