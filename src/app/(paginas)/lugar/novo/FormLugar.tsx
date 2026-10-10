"use client";

import { useFormulario } from "@/lib/useFormulario";
import { SeletorLocal } from "@/components/mapa/SeletorLocal";
import { criarLugar } from "@/lib/acoes/relatos";
import { CATEGORIAS, DESCRICAO_CATEGORIA, ROTULO_CATEGORIA } from "@/lib/estimulos";

export function FormLugar() {
  const [estado, enviar, enviando] = useFormulario(criarLugar, {});
  return (
    <form onSubmit={enviar} className="space-y-5">
      <div>
        <label htmlFor="nome" className="rotulo">
          Nome do lugar
        </label>
        <input id="nome" name="nome" required maxLength={200} className="campo" />
      </div>
      <div>
        <label htmlFor="categoria" className="rotulo">
          Tipo de lugar
        </label>
        <select id="categoria" name="categoria" required defaultValue="" className="campo">
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
        <input id="endereco" name="endereco" maxLength={300} className="campo" placeholder="Rua, número" />
      </div>
      <div>
        <label htmlFor="bairro" className="rotulo">
          Bairro (opcional)
        </label>
        <input id="bairro" name="bairro" maxLength={100} className="campo" />
      </div>
      <fieldset>
        <legend className="rotulo">Local no mapa</legend>
        <SeletorLocal />
      </fieldset>
      <div role="alert">{estado.erro && <p className="erro">{estado.erro}</p>}</div>
      <button type="submit" className="botao" disabled={enviando}>
        {enviando ? "Salvando…" : "Adicionar lugar"}
      </button>
    </form>
  );
}
