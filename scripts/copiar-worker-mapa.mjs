// O MapLibre 6 roda um web worker em arquivo separado, que o bundler não serve.
// Copiamos o worker para public/ antes do dev e do build (ver setWorkerUrl em src/components/mapa/base.ts).
import { copyFileSync } from "node:fs";

copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/maplibre-gl-worker.mjs");
