import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/** Cliente com a chave secreta. Usar só no servidor, para apagar contas. */
export function criarClienteAdmin() {
  if (!env.supabaseSecretKey) {
    throw new Error("SUPABASE_SECRET_KEY não configurada.");
  }
  return createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
