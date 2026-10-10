"use client";

import type { Map as MapaLibre, Marker } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { carregarMapLibre, corDoTema, criarMapa } from "./base";

/** Mapa para marcar a localização de um lugar novo. Grava lat/lng em campos ocultos. */
export function SeletorLocal({ nomeLat = "lat", nomeLng = "lng" }: { nomeLat?: string; nomeLng?: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [ponto, setPonto] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let mapa: MapaLibre | null = null;
    let marcador: Marker | null = null;
    const controle = new AbortController();
    criarMapa(container.current!, controle.signal)
      .then(async (m) => {
        if (!m) return;
        mapa = m;
        const { Marker } = await carregarMapLibre();
        m.on("click", (e) => {
          const { lat, lng } = e.lngLat;
          marcador ??= new Marker({ color: corDoTema("--destaque", "#2f6461") }).addTo(m);
          marcador.setLngLat([lng, lat]);
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
