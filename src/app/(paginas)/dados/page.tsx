import type { Metadata } from "next";
import { PainelDados } from "@/components/dados/PainelDados";
import { relatosParaEstatistica } from "@/lib/metricas";

export const metadata: Metadata = {
  title: "Dados abertos",
  description:
    "Estatísticas abertas dos relatos do Mapa Sensorial: quais estímulos sensoriais mais aparecem em cafés, restaurantes, shoppings e outros lugares de Porto Alegre.",
};

export default async function PaginaDados() {
  const { relatos, lugaresAvaliados } = await relatosParaEstatistica();
  return <PainelDados relatos={relatos} lugaresAvaliados={lugaresAvaliados} />;
}
