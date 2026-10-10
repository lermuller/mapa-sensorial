import Link from "next/link";
import { obterCadastro } from "@/lib/dados";
import { usuarioAtualId } from "@/lib/supabase/server";
import { Avatar } from "./Avatar";
import { Simbolo } from "./Personagem";

export async function Cabecalho() {
  const usuarioId = await usuarioAtualId();
  const avatar = usuarioId ? (await obterCadastro(usuarioId))?.avatar : null;
  return (
    // Navbar flutuante: pílula sobre o conteúdo (na página inicial, sobre o mapa).
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 px-2 pt-2 sm:px-3 sm:pt-3">
      <nav
        aria-label="Principal"
        className="pointer-events-auto mx-auto flex max-w-6xl items-center gap-2 rounded-full bg-fundo py-1.5 pl-3 pr-1.5 shadow-suave sm:gap-3 sm:pl-4"
        style={{ border: "max(1px, var(--linha)) solid var(--borda)" }}
      >
        {/* Assinatura: símbolo + nome + "como é lá?" */}
        <Link
          href="/"
          aria-label="Mapa Sensorial, como é lá? Página inicial"
          className="mr-auto flex min-w-0 items-center gap-2 py-1 text-texto no-underline"
        >
          <Simbolo className="h-7 w-8" />
          {/* No celular, só o símbolo */}
          <span aria-hidden="true" className="hidden min-w-0 leading-none sm:block">
            <span className="block truncate text-[1.0625rem] font-extrabold tracking-[-0.04em]">
              Mapa Sensorial
            </span>
            <span className="-mt-0.5 block text-xs font-bold text-verde-titulo">como é lá?</span>
          </span>
        </Link>
        <Link href="/perfil" className="chip">
          <span className="sm:hidden">Meu perfil</span>
          <span className="hidden sm:inline">Meu perfil sensorial</span>
        </Link>
        {usuarioId ? (
          <Link href="/conta" className="chip gap-1.5 pl-1">
            <Avatar valor={avatar} className="h-7 w-7" />
            Conta
          </Link>
        ) : (
          <Link href="/entrar" className="botao botao-escuro">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
