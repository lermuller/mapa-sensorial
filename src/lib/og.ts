import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Forma, Rosto } from "@/components/Personagem";

// Peças das imagens de prévia (Open Graph) que aparecem ao compartilhar um link no
// WhatsApp, Instagram etc. O gerador de imagem não entende variáveis CSS nem o sprite
// embutido na página, então montamos cada personagem como um SVG próprio, com cores fixas.

const pasta = join(process.cwd(), "src/assets");
const sprite = readFileSync(join(pasta, "personagens.svg"), "utf8");

/** Cores da marca no tema claro (globals.css). */
export const COR_OG = {
  fundo: "#ffffff",
  verdeClaro: "#c9f0de",
  verde: "#5ed3a6",
  verdeTitulo: "#23805c",
  texto: "#1a1d1c",
  textoSuave: "#5f6664",
  som: "#d9c2ff",
  luz: "#ffe27a",
  cheiro: "#ffc2e2",
  lotacao: "#ffc59e",
  visual: "#c2ccff",
  temperatura: "#ffae9e",
  geral: "#5ed3a6",
} as const;

export function fontesOg() {
  return [
    {
      name: "Atkinson",
      data: readFileSync(join(pasta, "fontes/AtkinsonHyperlegibleNext-Regular.ttf")),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Atkinson",
      data: readFileSync(join(pasta, "fontes/AtkinsonHyperlegibleNext-ExtraBold.ttf")),
      weight: 800 as const,
      style: "normal" as const,
    },
  ];
}

function simbolo(id: string): string {
  const m = sprite.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?</symbol>`));
  if (!m) throw new Error(`Personagem não encontrado no sprite: ${id}`);
  return m[0];
}

/** Personagem como imagem (data URI), para usar em <img> dentro da ImageResponse. */
export function personagemOg(forma: Forma, rosto: Rosto, branco = false): string {
  const p = simbolo(`p-${forma}-${rosto}`);
  const f = p.match(/<use href="#(f-[a-z]+)"\/>/)?.[1];
  const defs = (f ? simbolo(f) : "") + p;
  const cores = defs
    .replace(/var\(--c-([a-z]+)\)/g, (_, c: string) =>
      branco ? "#ffffff" : (COR_OG[c as keyof typeof COR_OG] ?? COR_OG.geral),
    )
    .replace(/var\(--contorno\)/g, "transparent")
    .replace(/var\(--rosto\)/g, COR_OG.texto);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 120 120"><defs>${cores}</defs><use href="#p-${forma}-${rosto}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Símbolo da marca (mesmo desenho de <Simbolo />). */
export function simboloOg(cor: string = COR_OG.verde): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 235 214"><path fill="${cor}" d="M22.7169 14.4782L78.434 0.518414C92.4905 -3.00339 103.159 12.1472 96.4226 23.941C96.08 24.4477 95.7487 24.9617 95.4247 25.4802C95.2326 25.7453 95.0341 26.0103 94.8225 26.2704L94.8585 26.4084C88.1018 37.752 85.7541 51.7065 89.4414 65.4675C96.6866 92.5073 124.48 108.554 151.519 101.308C167.681 96.9779 179.912 85.3061 185.593 70.8429C193.132 58.7557 212.27 60.8526 216.387 75.3821L233.632 136.249C238.194 152.351 228.698 169.073 212.533 173.404L65.0318 212.927C54.3626 215.786 43.3958 209.454 40.5369 198.785L1.03007 51.3434C-3.30771 35.1546 6.45947 18.5514 22.7169 14.4782Z"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
