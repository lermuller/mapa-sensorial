/* eslint-disable @next/next/no-img-element -- a ImageResponse só aceita <img> */
import { ImageResponse } from "next/og";
import { ROSTO_DO_NIVEL } from "@/components/Personagem";
import { obterDetalheLugar } from "@/lib/dados";
import { ESTIMULOS, INFO_ESTIMULO, ROTULO_CATEGORIA, rotuloNivel } from "@/lib/estimulos";
import { COR_OG, fontesOg, personagemOg, simboloOg } from "@/lib/og";

// Prévia do lugar ao compartilhar o link (WhatsApp, redes sociais). Rota comum, e não
// opengraph-image, para ter um endereço fixo usado também pela página inicial (?lugar=).
const size = { width: 1200, height: 630 };

export async function GET(_req: Request, ctx: RouteContext<"/og/lugar/[id]">) {
  const { id } = await ctx.params;
  const detalhe = await obterDetalheLugar(id);
  const nome = detalhe?.lugar.nome ?? "Mapa Sensorial";
  const local = detalhe
    ? [ROTULO_CATEGORIA[detalhe.lugar.categoria], detalhe.lugar.bairro].filter(Boolean).join(" · ")
    : "Porto Alegre";
  // Os estímulos com nível, na ordem fixa; no máximo 6 cabem numa linha.
  const comNivel = detalhe ? ESTIMULOS.filter((e) => detalhe.badges[e]) : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COR_OG.fundo,
          padding: "56px 64px",
          fontFamily: "Atkinson",
          color: COR_OG.texto,
        }}
      >
        {/* Assinatura */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src={simboloOg()} width={56} height={51} alt="" />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>Mapa Sensorial</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: COR_OG.verdeTitulo }}>como é lá?</span>
          </div>
        </div>

        {/* Lugar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span
            style={{
              fontSize: nome.length > 28 ? 64 : 80,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 0.95,
            }}
          >
            {nome.length > 48 ? `${nome.slice(0, 46)}…` : nome}
          </span>
          <span style={{ fontSize: 30, color: COR_OG.textoSuave }}>{local}</span>
        </div>

        {/* Estímulos: blocos como no site, com o personagem branco na cara do nível */}
        {comNivel.length > 0 ? (
          <div style={{ display: "flex", gap: 14 }}>
            {comNivel.map((e) => {
              const b = detalhe!.badges[e]!;
              return (
                <div
                  key={e}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    width: 168,
                    height: 150,
                    padding: 18,
                    borderRadius: 28,
                    overflow: "hidden",
                    background: COR_OG[e],
                  }}
                >
                  <span style={{ fontSize: 22, fontWeight: 800 }}>{INFO_ESTIMULO[e].nome}</span>
                  <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.5 }}>
                    {rotuloNivel(e, b.nivel)}
                  </span>
                  <img
                    src={personagemOg(e, ROSTO_DO_NIVEL[b.nivel], true)}
                    width={84}
                    height={84}
                    alt=""
                    style={{ position: "absolute", right: -12, bottom: -14 }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              height: 150,
              padding: "0 40px",
              borderRadius: 28,
              overflow: "hidden",
              background: COR_OG.verdeClaro,
            }}
          >
            <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>
              Ainda sem relatos. Conte como é lá!
            </span>
            <img
              src={personagemOg("bolha", "curioso")}
              width={150}
              height={150}
              alt=""
              style={{ position: "absolute", right: -10, bottom: -30 }}
            />
          </div>
        )}
      </div>
    ),
    { ...size, fonts: fontesOg() },
  );
}
