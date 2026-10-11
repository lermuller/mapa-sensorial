"use client";

import { useState } from "react";

/**
 * Compartilha um lugar: no celular abre o menu de compartilhar do aparelho (WhatsApp etc.);
 * onde não houver, copia o texto com o link. O link mostra a prévia do lugar.
 */
export function BotaoCompartilhar({
  caminho,
  titulo,
  texto,
  className = "",
}: {
  /** Caminho do lugar, como "/?lugar=…". */
  caminho: string;
  titulo: string;
  texto: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = new URL(caminho, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto, url });
        return;
      } catch (e) {
        // Cancelar o menu não é erro; outros erros caem na cópia do link.
        if (e instanceof DOMException && e.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${texto}\n${url}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      window.prompt("Copie o link do lugar:", url);
    }
  }

  return (
    <>
      <button type="button" onClick={compartilhar} className={`botao botao-secundario ${className}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          {/* Seta saindo da caixa: símbolo comum de compartilhar */}
          <path d="M12 3v12M7 8l5-5 5 5" />
          <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
        </svg>
        {copiado ? "Link copiado" : "Compartilhar"}
      </button>
      <span role="status" className="sr-only">
        {copiado ? "Link do lugar copiado" : ""}
      </span>
    </>
  );
}
