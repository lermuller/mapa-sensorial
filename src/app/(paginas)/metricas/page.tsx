import { redirect } from "next/navigation";

// As métricas ficam na aba "Métricas" da conta (só moderação).
export default function PaginaMetricas() {
  redirect("/conta?aba=metricas");
}
