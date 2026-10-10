// O MapLibre 6 roda um web worker em arquivo separado, que o bundler não serve.
// Copiamos o worker para public/ antes do dev e do build (ver setWorkerUrl em src/components/mapa/base.ts).
import { copyFileSync, mkdirSync } from "node:fs";

// public/ só tem arquivos gerados (fora do Git); num clone novo, como no deploy, ela não existe.
mkdirSync("public", { recursive: true });
copyFileSync("node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs", "public/maplibre-gl-worker.mjs");
