/* eslint-disable @next/next/no-img-element -- a ImageResponse só aceita <img> */
import { ImageResponse } from "next/og";
import { ESTIMULOS } from "@/lib/estimulos";
import { COR_OG, fontesOg, personagemOg, simboloOg } from "@/lib/og";

// Imagem de prévia padrão do site (página inicial e páginas sem imagem própria).
// Fica numa rota, e não em app/opengraph-image, porque a imagem por arquivo teria
// prioridade sobre a prévia de cada lugar na página inicial (?lugar=).
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COR_OG.verdeClaro,
          padding: "64px 72px",
          fontFamily: "Atkinson",
          color: COR_OG.texto,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={simboloOg(COR_OG.texto)} width={64} height={58} alt="" />
          <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>Mapa Sensorial</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 760 }}>
          <span style={{ fontSize: 120, fontWeight: 800, letterSpacing: -5, lineHeight: 0.9 }}>
            como é lá?
          </span>
          <span style={{ fontSize: 34, lineHeight: 1.3 }}>
            Barulho, luz, cheiros e movimento dos lugares do Brasil, contados pela
            comunidade. Veja antes de ir.
          </span>
        </div>
        {/* Os seis personagens dos estímulos, cortados na borda de baixo */}
        <div style={{ display: "flex", position: "absolute", right: 40, bottom: -36, gap: 4 }}>
          {ESTIMULOS.map((e, i) => (
            <img
              key={e}
              src={personagemOg(e, i % 2 ? "feliz" : "calmo")}
              width={118}
              height={118}
              alt=""
              style={{ marginBottom: i % 2 ? 24 : 0 }}
            />
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: fontesOg() },
  );
}
