"use client";

import type { Map as MapaLibre, Marker } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { carregarMapLibre, corDoTema, criarMapa } from "./base";
import { pedirLocalizacao } from "./localizacao";

type Ponto = { lat: number; lng: number };

/** Mapa para marcar a localização de um lugar. Grava lat/lng em campos ocultos. */
export function SeletorLocal({
  nomeLat = "lat",
  nomeLng = "lng",
  inicial = null,
  aoMudar,
}: {
  nomeLat?: string;
  nomeLng?: string;
  /** Ponto já marcado (ao corrigir um lugar). */
  inicial?: Ponto | null;
  /** Avisa quando a pessoa marca outro ponto (ex.: para procurar lugares repetidos por perto). */
  aoMudar?: (p: Ponto) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ponto, setPonto] = useState<Ponto | null>(inicial);
  const inicialRef = useRef(inicial);
  const aoMudarRef = useRef(aoMudar);
  useEffect(() => {
    aoMudarRef.current = aoMudar;
  });
  const mapaRef = useRef<MapaLibre | null>(null);
  const [aviso, setAviso] = useState("");

  /** Leva o mapa até a pessoa, para marcar um lugar fora de Porto Alegre sem arrastar o mapa. */
  async function irParaPerto() {
    setAviso("");
    try {
      const { lat, lng } = await pedirLocalizacao();
      mapaRef.current?.jumpTo({ center: [lng, lat], zoom: 16 });
    } catch (e) {
      setAviso((e as Error).message);
    }
  }

  useEffect(() => {
    let mapa: MapaLibre | null = null;
    let marcador: Marker | null = null;
    const controle = new AbortController();
    const comeco = inicialRef.current;
    criarMapa(
      container.current!,
      controle.signal,
      comeco ? { center: [comeco.lng, comeco.lat], zoom: 16 } : {},
    )
      .then(async (m) => {
        if (!m) return;
        mapa = m;
        mapaRef.current = m;
        const { Marker } = await carregarMapLibre();
        const cor = corDoTema("--destaque", "#2f6461");
        if (comeco) marcador = new Marker({ color: cor }).setLngLat([comeco.lng, comeco.lat]).addTo(m);
        m.on("click", (e) => {
          const { lat, lng } = e.lngLat;
          // A posição vem antes do addTo: sem ela, o MapLibre falha ao desenhar o pin, que fica
          // preso no canto, e o mapa passa a responder mal ao zoom e ao arraste.
          if (marcador) marcador.setLngLat([lng, lat]);
          else marcador = new Marker({ color: cor }).setLngLat([lng, lat]).addTo(m);
          setPonto({ lat, lng });
          aoMudarRef.current?.({ lat, lng });
        });
      })
      .catch(console.error);
    return () => {
      controle.abort();
      mapa?.remove();
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button type="button" onClick={irParaPerto} className="botao-terciario">
          Ir para minha localização
        </button>
      </div>
      {aviso && (
        <p role="alert" className="erro text-sm">
          {aviso}
        </p>
      )}
      <div
        ref={container}
        className="h-72 w-full overflow-hidden rounded-xl border border-borda"
        role="application"
        aria-label="Mapa para marcar o local. Toque no ponto onde fica o lugar."
      />
      <p className="ajuda" aria-live="polite">
        {ponto
          ? "Local marcado. Toque em outro ponto para mudar."
          : "Toque no mapa onde fica o lugar."}
      </p>
      <input type="hidden" name={nomeLat} value={ponto?.lat ?? ""} />
      <input type="hidden" name={nomeLng} value={ponto?.lng ?? ""} />
    </div>
  );
}
