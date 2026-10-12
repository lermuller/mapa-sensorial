import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LinkSeta, VoltarAoMapa } from "@/components/LinkSeta";
import { sair } from "@/lib/acoes/conta";
import { ehModeradora } from "@/lib/acoes/moderacao";
import { AVATAR_PADRAO } from "@/lib/avatar";
import { obterCadastro, relatosDoUsuario } from "@/lib/dados";
import { formatarData } from "@/lib/formato";
import { primeiro } from "@/lib/parametros";
import { criarClienteServidor, usuarioAtualId } from "@/lib/supabase/server";
import { PainelMetricas } from "@/components/metricas/PainelMetricas";
import { metricasInternas } from "@/lib/metricas";
import { FormPerfil } from "../perfil/FormPerfil";
import { CabecalhoConta } from "./CabecalhoConta";
import { FormApagarConta } from "./Formularios";

export const metadata: Metadata = { title: "Minha conta" };

type Aba = "perfil" | "relatos" | "metricas";

const ABAS: { id: Aba; rotulo: string; href: string; soModeracao?: boolean }[] = [
  { id: "perfil", rotulo: "Perfil", href: "/conta" },
  { id: "relatos", rotulo: "Meus relatos", href: "/conta?aba=relatos" },
  { id: "metricas", rotulo: "Métricas", href: "/conta?aba=metricas", soModeracao: true },
];

export default async function PaginaConta(props: PageProps<"/conta">) {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect("/entrar?voltar=/conta");
  const sp = await props.searchParams;
  const abaPedida = primeiro(sp.aba);
  const perfilApagado = primeiro(sp.apagado) === "1";

  const supabase = await criarClienteServidor();
  const [{ data: claims }, cadastro, relatos, moderadora] = await Promise.all([
    supabase.auth.getClaims(),
    obterCadastro(usuarioId),
    relatosDoUsuario(usuarioId),
    ehModeradora(),
  ]);
  const email = (claims?.claims?.email as string | undefined) ?? "";
  // A aba Métricas só existe para a moderação; para as outras pessoas, volta ao perfil.
  const aba: Aba =
    abaPedida === "relatos" ? "relatos" : abaPedida === "metricas" && moderadora ? "metricas" : "perfil";
  const metricas = aba === "metricas" ? await metricasInternas() : null;

  return (
    <div className="space-y-6">
      <VoltarAoMapa />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CabecalhoConta
            avatar={cadastro?.avatar ?? AVATAR_PADRAO}
            nomePublico={cadastro?.nome_publico ?? ""}
            nome={cadastro?.nome ?? ""}
            email={email}
          />
        </div>
        <form action={sair}>
          <button type="submit" className="botao botao-secundario">
            Sair
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-6">
        {/* Abas: coluna à esquerda no computador, linha no celular */}
        <nav aria-label="Seções da conta" className="flex gap-1 md:flex-col">
          {ABAS.filter((a) => !a.soModeracao || moderadora).map((a) => (
            <Link
              key={a.id}
              href={a.href}
              aria-current={aba === a.id ? "page" : undefined}
              className={`chip justify-between md:w-full md:rounded-2xl md:px-4 md:py-2.5 ${
                aba === a.id ? "bg-destaque-suave" : "border-transparent bg-transparent"
              }`}
            >
              {a.rotulo}
              {a.id === "relatos" && (
                <span className="text-xs font-semibold text-texto-suave">{relatos.length}</span>
              )}
            </Link>
          ))}
        </nav>

        <div className="min-w-0 space-y-6">
          {aba === "perfil" ? (
            <>
              <section aria-labelledby="titulo-perfil" className="cartao space-y-3">
                <h2 id="titulo-perfil" className="text-xl">
                  Perfil sensorial
                </h2>
                <p className="ajuda -mt-1">
                  Com o perfil ativo na busca, os lugares mais confortáveis para ele aparecem
                  primeiro e o melhor horário de cada lugar é calculado para esses estímulos.
                  Ninguém mais vê.
                </p>
                {perfilApagado && (
                  <p className="sucesso" role="status">
                    Seu perfil sensorial foi apagado.
                  </p>
                )}
                <FormPerfil perfil={cadastro?.perfil ?? []} semTitulo />
              </section>

              {moderadora && (
                <LinkSeta href="/moderacao">Moderação de relatos denunciados</LinkSeta>
              )}

              <section aria-labelledby="titulo-apagar" className="space-y-3 border-t border-borda pt-6">
                <h2 id="titulo-apagar" className="text-xl">
                  Apagar conta
                </h2>
                <p className="text-sm">
                  Apaga sua conta, seu perfil sensorial e todos os seus relatos ({relatos.length}).
                  Não dá para desfazer.
                </p>
                <FormApagarConta />
              </section>
            </>
          ) : aba === "metricas" && metricas ? (
            <section aria-labelledby="titulo-metricas" className="space-y-4">
              <div className="space-y-1">
                <h2 id="titulo-metricas" className="text-xl">
                  Métricas da plataforma
                </h2>
                <p className="ajuda">
                  Só contagens, sem dados pessoais nem perfis sensoriais. Os números públicos estão
                  nos <Link href="/dados">dados abertos</Link>.
                </p>
              </div>
              <PainelMetricas m={metricas} />
            </section>
          ) : (
            <section aria-labelledby="titulo-relatos" className="space-y-3">
              <h2 id="titulo-relatos" className="text-xl">
                Meus relatos ({relatos.length})
              </h2>
              {relatos.length === 0 ? (
                <div className="flex flex-wrap items-center gap-x-2 text-sm">
                  <span className="italic text-texto-suave">
                    Você ainda não contou como é nenhum lugar.
                  </span>
                  <LinkSeta href="/">Buscar um lugar</LinkSeta>
                </div>
              ) : (
                <ul className="space-y-2">
                  {relatos.map((r) => (
                    <li
                      key={r.id}
                      className="cartao flex flex-wrap items-baseline gap-x-4 gap-y-1 bg-fundo"
                    >
                      <Link
                        href={`/?lugar=${r.lugar_id}&painel=relatos`}
                        className="font-bold text-texto no-underline hover:underline"
                      >
                        {r.lugar_nome}
                      </Link>
                      <span className="ajuda">{formatarData(r.criado_em)}</span>
                      <span className="ml-auto flex gap-1 text-sm">
                        <Link href={`/relato/${r.id}/editar`} className="botao-terciario">
                          Editar
                        </Link>
                        <Link href={`/relato/${r.id}/apagar`} className="botao-terciario">
                          Apagar
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
