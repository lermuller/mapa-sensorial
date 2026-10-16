"use client";

import type { Map as MapaLibre, Marker } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { carregarMapLibre, corDoTema, criarMapa } from "./base";
import { pedirLocalizacao } from "./localizacao";

/** Mapa para marcar a localização de um lugar novo. Grava lat/lng em campos ocultos. */
export function SeletorLocal({ nomeLat = "lat", nomeLng = "lng" }: { nomeLat?: string; nomeLng?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [ponto, setPonto] = useState<{ lat: number; lng: number } | null>(null);
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
    criarMapa(container.current!, controle.signal)
      .then(async (m) => {
        if (!m) return;
        mapa = m;
        mapaRef.current = m;
        const { Marker } = await carregarMapLibre();
        m.on("click", (e) => {
          const { lat, lng } = e.lngLat;
          // A posição vem antes do addTo: sem ela, o MapLibre falha ao desenhar o pin, que fica
          // preso no canto, e o mapa passa a responder mal ao zoom e ao arraste.
          if (marcador) marcador.setLngLat([lng, lat]);
          else marcador = new Marker({ color: corDoTema("--destaque", "#2f6461") }).setLngLat([lng, lat]).addTo(m);
          setPonto({ lat, lng });
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
