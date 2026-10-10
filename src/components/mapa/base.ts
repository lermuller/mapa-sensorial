"use client";

import type { Map as MapaLibre, MapOptions } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Tiles vetoriais do OpenFreeMap (dados do OpenStreetMap), gratuitos e sem chave.
// "positron" é um estilo de cores claras e pouco contraste.
export const ESTILO_MAPA = "https://tiles.openfreemap.org/styles/positron";

export const CENTRO_POA: [number, number] = [-51.2177, -30.0346];

/** Cor do tema atual, lida das variáveis CSS (o mapa não entende var()). */
export function corDoTema(nome: string, padrao: string): string {
  if (typeof window === "undefined") return padrao;
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim() || padrao;
}

let carregamento: Promise<typeof import("maplibre-gl")> | null = null;

/** Carrega o MapLibre uma vez só e aponta o worker para public/. */
export function carregarMapLibre() {
  carregamento ??= import("maplibre-gl").then((m) => {
    m.setWorkerUrl("/maplibre-gl-worker.mjs");
    return m;
  });
  return carregamento;
}

/**
 * Cria um mapa sem animações: sem rotação, sem inclinação, sem esmaecimento,
 * e com zoom por rolagem só com Ctrl/⌘ (não prende a rolagem da página).
 * Devolve null se o sinal for abortado antes de o mapa ser criado.
 */
export async function criarMapa(
  container: HTMLElement,
  sinal: AbortSignal,
  opcoes: Partial<MapOptions> = {},
): Promise<MapaLibre | null> {
  const { Map, NavigationControl } = await carregarMapLibre();
  // O componente pode ter sido desmontado durante o import; criar o mapa agora
  // deixaria duas instâncias no mesmo container.
  if (sinal.aborted) return null;
  const mapa = new Map({
    container,
    style: ESTILO_MAPA,
    center: CENTRO_POA,
    zoom: 12,
    fadeDuration: 0,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    cooperativeGestures: true,
    // Crédito recolhido num botão (i): aberto, cobre os botões do mapa no celular.
    attributionControl: { compact: true },
    locale: {
      "CooperativeGesturesHandler.WindowsHelpText": "Use Ctrl + rolagem para aproximar o mapa",
      "CooperativeGesturesHandler.MacHelpText": "Use ⌘ + rolagem para aproximar o mapa",
      "CooperativeGesturesHandler.MobileHelpText": "Use dois dedos para mover o mapa",
      "NavigationControl.ZoomIn": "Aproximar",
      "NavigationControl.ZoomOut": "Afastar",
      "Map.Title": "Mapa",
      "AttributionControl.ToggleAttribution": "Mostrar ou esconder os créditos do mapa",
      "AttributionControl.MapFeedback": "Sugerir correção no mapa",
    },
    ...opcoes,
  });
  mapa.touchZoomRotate.disableRotation();
  if (opcoes.interactive !== false) {
    // Embaixo à direita: no topo ficam a busca e os filtros.
    mapa.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
  }
  return mapa;
}
