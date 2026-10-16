"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SeletorLocal } from "@/components/mapa/SeletorLocal";
import type { EstadoForm } from "@/lib/acoes/relatos";
import { CATEGORIAS, DESCRICAO_CATEGORIA, ROTULO_CATEGORIA, type Categoria } from "@/lib/estimulos";
import { useFormulario } from "@/lib/useFormulario";

type Proximo = { id: string; nome: string; tipo: string; metros: number };

export type LugarInicial = {
  id: string;
  nome: string;
  categoria: Categoria;
  endereco: string | null;
  bairro: string | null;
  lat: number;
  lng: number;
};

/** Formulário de lugar: adicionar um lugar novo ou corrigir um existente. */
export function FormLugar({
  acao,
  inicial,
  textoBotao = "Adicionar lugar",
}: {
  acao: (anterior: EstadoForm, form: FormData) => Promise<EstadoForm>;
  inicial?: LugarInicial;
  textoBotao?: string;
}) {
  const [estado, enviar, enviando] = useFormulario(acao, {});
  const [ponto, setPonto] = useState(inicial ? { lat: inicial.lat, lng: inicial.lng } : null);
  const [proximos, setProximos] = useState<Proximo[]>([]);

  // Lugares a até ~150 m do ponto marcado: pode ser que o lugar já esteja no mapa.
  useEffect(() => {
    if (!ponto) return;
    const controle = new AbortController();
    const u = new URLSearchParams({ lat: String(ponto.lat), lng: String(ponto.lng) });
    if (inicial) u.set("ignorar", inicial.id);
    fetch(`/lugares-proximos?${u.toString()}`, { signal: controle.signal })
      .then((r) => r.json())
      .then((d: { lugares: Proximo[] }) => setProximos(d.lugares))
      .catch(() => {});
    return () => controle.abort();
  }, [ponto, inicial]);

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div>
        <label htmlFor="nome" className="rotulo">
          Nome do lugar
        </label>
        <input id="nome" name="nome" required maxLength={200} defaultValue={inicial?.nome} className="campo" />
      </div>
      <div>
        <label htmlFor="categoria" className="rotulo">
          Tipo de lugar
        </label>
        <select id="categoria" name="categoria" required defaultValue={inicial?.categoria ?? ""} className="campo">
          <option value="" disabled>
            Escolha
          </option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {ROTULO_CATEGORIA[c]}
              {DESCRICAO_CATEGORIA[c] ? ` (${DESCRICAO_CATEGORIA[c]})` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="endereco" className="rotulo">
          Endereço (opcional)
        </label>
        <input
          id="endereco"
          name="endereco"
          maxLength={300}
          defaultValue={inicial?.endereco ?? ""}
          className="campo"
          placeholder="Rua, número"
        />
      </div>
      <div>
        <label htmlFor="bairro" className="rotulo">
          Bairro (opcional)
        </label>
        <input id="bairro" name="bairro" maxLength={100} defaultValue={inicial?.bairro ?? ""} className="campo" />
      </div>
      <fieldset>
        <legend className="rotulo">Local no mapa</legend>
        <SeletorLocal inicial={ponto} aoMudar={setPonto} />
      </fieldset>

      {proximos.length > 0 && (
        <section aria-labelledby="titulo-proximos" className="cartao space-y-2" role="status">
          <h2 id="titulo-proximos" className="text-base">
            Já está no mapa?
          </h2>
          <p className="ajuda">
            Estes lugares ficam bem perto do ponto marcado. Se for um deles, abra o que já existe
            em vez de adicionar de novo.
          </p>
          <ul className="space-y-1 text-sm">
            {proximos.map((l) => (
              <li key={l.id}>
                <Link href={`/?lugar=${l.id}`} className="font-bold">
                  {l.nome}
                </Link>{" "}
                <span className="text-texto-suave">
                  · {l.tipo} · a {l.metros} m
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div role="alert">{estado.erro && <p className="erro">{estado.erro}</p>}</div>
      <div className="flex justify-end">
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? "Salvando…" : textoBotao}
        </button>
      </div>
    </form>
  );
}
