import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/** Cliente Supabase para Server Components, Server Actions e Route Handlers. */
export async function criarClienteServidor() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseKey, {
    // Sem limite, um serviço lento (ex.: SMTP do e-mail travado) deixaria a tela esperando para sempre.
    global: {
      fetch: (url, init) => fetch(url, { ...init, signal: init?.signal ?? AbortSignal.timeout(20_000) }),
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          cookiesParaGravar.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado de um Server Component: o proxy já renova a sessão.
        }
      },
    },
  });
}

/** Id da pessoa logada, ou null. */
export async function usuarioAtualId(): Promise<string | null> {
  await cookies(); // marca a rota como dinâmica mesmo sem Supabase configurado
  if (!env.supabaseUrl || !env.supabaseKey) return null;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
}
