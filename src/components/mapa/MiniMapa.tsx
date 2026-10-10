"use client";

import type { Map as MapaLibre } from "maplibre-gl";
import { useEffect, useRef } from "react";
import { LinkSeta } from "@/components/LinkSeta";
import { carregarMapLibre, corDoTema, criarMapa } from "./base";

/** Mapa pequeno e fixo, só para localizar o lugar. */
export function MiniMapa({ lat, lng, nome }: { lat: number; lng: number; nome: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mapa: MapaLibre | null = null;
    const controle = new AbortController();
    criarMapa(container.current!, controle.signal, { center: [lng, lat], zoom: 16, interactive: false })
      .then(async (m) => {
        if (!m) return;
        mapa = m;
        const { Marker } = await carregarMapLibre();
        new Marker({ color: corDoTema("--destaque", "#2f6461") }).setLngLat([lng, lat]).addTo(m);
      })
      .catch(console.error);
    return () => {
      controle.abort();
      mapa?.remove();
    };
  }, [lat, lng]);

  return (
    <div className="space-y-1">
      <div
        ref={container}
        className="h-56 w-full overflow-hidden rounded-xl border border-borda"
        role="img"
        aria-label={`Mapa com a localização de ${nome}`}
      />
      <LinkSeta
        externo
        className="text-sm"
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`}
      >
        Abrir no OpenStreetMap
      </LinkSeta>
    </div>
  );
}
