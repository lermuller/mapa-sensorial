import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { cookies } from "next/headers";
import { Cabecalho } from "@/components/Cabecalho";
import { SeletorAparencia } from "@/components/SeletorAparencia";
import { SpritePersonagens } from "@/components/SpritePersonagens";
import { COOKIE_CONTRASTE, COOKIE_TEMA, lerContraste, lerTema } from "@/lib/aparencia";
import "./globals.css";

// Fonte pensada para legibilidade.
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: { default: "Mapa Sensorial · como é lá?", template: "%s · Mapa Sensorial" },
  description:
    "Como é lá? Relatos da comunidade sobre som, luz, cheiro, lotação, visual e temperatura dos lugares de Porto Alegre.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#121514" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const c = await cookies();
  const tema = lerTema(c.get(COOKIE_TEMA)?.value);
  const contraste = lerContraste(c.get(COOKIE_CONTRASTE)?.value);
  return (
    <html
      lang="pt-BR"
      className={`${atkinson.variable} h-full`}
      data-tema={tema === "auto" ? undefined : tema}
      data-contraste={contraste === "auto" ? undefined : contraste}
    >
      <body className="flex min-h-full flex-col">
        <SpritePersonagens />
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-superficie focus:p-2"
        >
          Pular para o conteúdo
        </a>
        <Cabecalho />
        <main id="conteudo" className="flex w-full flex-1 flex-col">
          {children}
        </main>
        <SeletorAparencia temaInicial={tema} contrasteInicial={contraste} />
      </body>
    </html>
  );
}
