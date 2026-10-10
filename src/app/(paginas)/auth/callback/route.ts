import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

// Destino do link mágico: troca o código por uma sessão.
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const voltarBruto = url.searchParams.get("voltar") ?? "/";
  const voltar = voltarBruto.startsWith("/") && !voltarBruto.startsWith("//") ? voltarBruto : "/";

  if (code) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(voltar, url.origin));
    console.error(error);
  }
  return NextResponse.redirect(new URL("/entrar?erro=link", url.origin));
}
