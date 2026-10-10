"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { atualizarNomePublico, salvarAvatar } from "@/lib/acoes/conta";
import { AVATARES } from "@/lib/avatar";
import { useFormulario } from "@/lib/useFormulario";

const LAPIS = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20h4L19 9l-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </svg>
);

/**
 * Topo da conta: avatar e nome público, cada um com um lápis para editar ali mesmo.
 * O avatar abre uma fileira curta de opções; escolher uma já salva.
 */
export function CabecalhoConta({
  avatar,
  nomePublico,
  nome,
  email,
}: {
  avatar: string;
  nomePublico: string;
  nome: string;
  email: string;
}) {
  const [trocandoAvatar, setTrocandoAvatar] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [estadoAvatar, enviarAvatar, salvandoAvatar] = useFormulario(salvarAvatar, {});
  const [estadoNome, enviarNome, salvandoNome] = useFormulario(atualizarNomePublico, {});

  // Salvou o nome: volta para o modo de leitura (o novo nome vem do servidor).
  // Ajuste de estado durante a renderização, quando chega uma nova resposta.
  const [respostaVista, setRespostaVista] = useState(estadoNome);
  if (estadoNome !== respostaVista) {
    setRespostaVista(estadoNome);
    if (estadoNome.ok) setEditandoNome(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Avatar com lápis */}
        <div className="relative shrink-0">
          <Avatar valor={avatar} className="h-20 w-20" />
          <button
            type="button"
            onClick={() => setTrocandoAvatar((v) => !v)}
            aria-expanded={trocandoAvatar}
            aria-label="Trocar avatar"
            title="Trocar avatar"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-botao-2 text-botao-2-texto shadow-suave"
            style={{ background: "var(--botao-2)", color: "var(--botao-2-texto)" }}
          >
            {LAPIS}
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-texto-suave">Minha conta</p>
          {editandoNome ? (
            <form onSubmit={enviarNome} className="flex flex-wrap items-center gap-2">
              <label htmlFor="nome_publico" className="sr-only">
                Nome público
              </label>
              <input
                id="nome_publico"
                name="nome_publico"
                defaultValue={nomePublico}
                required
                maxLength={40}
                autoFocus
                className="campo max-w-xs text-lg font-bold"
              />
              <button type="button" onClick={() => setEditandoNome(false)} className="botao-terciario">
                Cancelar
              </button>
              <button type="submit" className="botao" disabled={salvandoNome}>
                {salvandoNome ? "Salvando…" : "Salvar"}
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <h1 className="display truncate text-3xl">{nomePublico}</h1>
              <button
                type="button"
                onClick={() => setEditandoNome(true)}
                aria-label="Editar nome público"
                title="Editar nome público"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-texto-suave hover:bg-destaque-suave hover:text-texto"
              >
                {LAPIS}
              </button>
            </div>
          )}
          <p className="truncate text-sm text-texto-suave">
            {nome} · {email}
          </p>
          {editandoNome && (
            <p className="ajuda mt-1">O nome público aparece nos seus relatos. Pode ser um apelido.</p>
          )}
        </div>
      </div>

      <div role="status">
        {estadoNome.ok && !editandoNome && <p className="sucesso">Nome público salvo.</p>}
        {estadoNome.erro && <p className="erro">{estadoNome.erro}</p>}
        {estadoAvatar.erro && <p className="erro">{estadoAvatar.erro}</p>}
      </div>

      {/* Fileira curta de avatares: escolher já salva */}
      {trocandoAvatar && (
        <form
          onSubmit={(e) => {
            enviarAvatar(e);
            setTrocandoAvatar(false);
          }}
          className="cartao p-3"
        >
          <p className="mb-2 text-sm font-bold">Escolha seu avatar</p>
          <div className="flex flex-wrap gap-2">
            {AVATARES.map((a, i) => (
              <button
                key={a}
                type="submit"
                name="avatar"
                value={a}
                disabled={salvandoAvatar}
                aria-label={`Avatar ${i + 1}${a === avatar ? " (atual)" : ""}`}
                aria-pressed={a === avatar}
                className={`rounded-full p-0.5 ${a === avatar ? "outline-3 outline-texto" : ""}`}
              >
                <Avatar valor={a} className="h-12 w-12" />
              </button>
            ))}
          </div>
        </form>
      )}
    </div>
  );
}
