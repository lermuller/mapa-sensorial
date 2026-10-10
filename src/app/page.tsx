import Form from "next/form";
import Link from "next/link";
import { Suspense } from "react";
import { BuscaMapa } from "@/components/busca/BuscaMapa";
import { Filtros } from "@/components/busca/Filtros";
import { ResumoProjeto } from "@/components/busca/SobreProjeto";
import { FormRelato } from "@/components/FormRelato";
import { ItemRelato } from "@/components/lugar/ItemRelato";
import { PainelLugar, type HrefsPainel } from "@/components/lugar/PainelLugar";
import { SubpainelLugar } from "@/components/lugar/SubpainelLugar";
import { criarRelato } from "@/lib/acoes/relatos";
import { hojeEmPortoAlegre } from "@/lib/formato";
import { usuarioAtualId } from "@/lib/supabase/server";
import type { Estimulo } from "@/lib/estimulos";
import {
  buscarLugares,
  LIMITE_BUSCA,
  obterDetalheLugar,
  obterPerfil,
  relatosDoLugar,
  type DetalheLugar,
  type Relato,
  type ResultadoBusca,
} from "@/lib/dados";
import { areaParaTexto, lerParamsBusca, primeiro } from "@/lib/parametros";

export default async function Inicio(props: PageProps<"/">) {
  const sp = await props.searchParams;
  const params = lerParamsBusca(sp);

  let resultados: ResultadoBusca[] = [];
  let detalhe: DetalheLugar | null = null;
  let relatos: Relato[] = [];
  let usuarioId: string | null = null;
  let falhou = false;
  const lugarId = primeiro(sp.lugar);
  // Segundo nível do painel do lugar: tudo fica sobre o mapa, sem trocar de página.
  const painel = primeiro(sp.painel);
  // Perfil sensorial da conta: entra na busca (mais confortáveis primeiro) quando ativado.
  // Os estímulos ficam só no servidor; a URL leva apenas perfil=1.
  usuarioId = await usuarioAtualId();
  const perfilConta: Estimulo[] | null = usuarioId ? await obterPerfil(usuarioId) : null;
  const perfilEmUso = params.usarPerfil && perfilConta ? perfilConta : [];
  const estimulosBusca = [...new Set([...params.estimulos, ...perfilEmUso])];
  try {
    [resultados, detalhe, relatos] = await Promise.all([
      buscarLugares({ ...params, estimulos: estimulosBusca }),
      lugarId ? obterDetalheLugar(lugarId) : Promise.resolve(null),
      lugarId && painel === "relatos" ? relatosDoLugar(lugarId) : Promise.resolve([]),
    ]);
  } catch (e) {
    console.error("Erro na busca", e);
    falhou = true;
  }

  const resumo = falhou
    ? "Não foi possível buscar agora."
    : resultados.length === 0
      ? "Nenhum lugar encontrado."
      : `${resultados.length}${resultados.length === LIMITE_BUSCA ? "+" : ""} ${
          resultados.length === 1 ? "lugar" : "lugares"
        }${params.area ? " nesta área" : ""}`;

  // Endereços do painel do lugar, mantendo a busca atual.
  const base = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (["lugar", "painel", "enviado"].includes(k)) continue;
    (Array.isArray(v) ? v : [v]).forEach((x) => x !== undefined && base.append(k, x));
  }
  const hrefLugar = (sub?: string) => {
    const u = new URLSearchParams(base);
    if (detalhe) u.set("lugar", detalhe.lugar.id);
    if (sub) u.set("painel", sub);
    return `/?${u.toString()}`;
  };
  const hrefs: HrefsPainel = {
    lista: base.toString() ? `/?${base.toString()}` : "/",
    resumo: hrefLugar(),
    relatos: hrefLugar("relatos"),
    relatar: hrefLugar("relatar"),
  };

  let conteudoLugar = null;
  if (detalhe && painel === "relatos") {
    conteudoLugar = (
      <SubpainelLugar
        nomeLugar={detalhe.lugar.nome}
        hrefVoltar={hrefs.resumo}
        titulo={`${relatos.length} ${relatos.length === 1 ? "relato" : "relatos"}`}
      >
        <ol className="space-y-2">
          {relatos.map((r) => (
            <li key={r.id}>
              <ItemRelato relato={r} proprio={r.usuario_id === usuarioId} logado={!!usuarioId} />
            </li>
          ))}
        </ol>
      </SubpainelLugar>
    );
  } else if (detalhe && painel === "relatar") {
    conteudoLugar = (
      <SubpainelLugar
        nomeLugar={detalhe.lugar.nome}
        hrefVoltar={hrefs.resumo}
        titulo="Contar como é lá"
      >
        {usuarioId ? (
          <>
            <p className="text-sm">Conta pra gente como estava. O relato fala do lugar, não de você.</p>
            <FormRelato
              acao={criarRelato.bind(null, detalhe.lugar.id)}
              hoje={hojeEmPortoAlegre()}
              textoBotao="Publicar meu relato"
            />
          </>
        ) : (
          <div className="cartao space-y-3 bg-fundo">
            <p>Para contar como é lá, entre na sua conta. Não tem senha: a gente manda um código por e-mail.</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Link
                href={`/cadastro?voltar=${encodeURIComponent(hrefs.relatar)}`}
                className="botao botao-secundario"
              >
                Criar conta
              </Link>
              <Link href={`/entrar?voltar=${encodeURIComponent(hrefs.relatar)}`} className="botao">
                Entrar
              </Link>
            </div>
          </div>
        )}
      </SubpainelLugar>
    );
  } else if (detalhe) {
    conteudoLugar = (
      <PainelLugar
        detalhe={detalhe}
        hrefs={hrefs}
        enviado={primeiro(sp.enviado) === "1"}
        perfil={perfilEmUso}
        logado={!!usuarioId}
      />
    );
  }

  const busca = (
    <div className="flex items-start gap-2">
      <Form action="/" role="search" className="flex min-w-0 flex-1 gap-2">
        <label htmlFor="busca" className="sr-only">
          Nome do lugar, endereço ou bairro
        </label>
        <input
          id="busca"
          name="q"
          type="search"
          defaultValue={params.termo}
          className="campo campo-pilula border-transparent shadow-suave"
          placeholder="Lugar, endereço ou bairro"
        />
        {params.categorias.map((c) => (
          <input key={c} type="hidden" name="tipo" value={c} />
        ))}
        {params.estimulos.length > 0 && (
          <input type="hidden" name="sens" value={params.estimulos.join(",")} />
        )}
        {params.faixa.dia && <input type="hidden" name="dia" value={params.faixa.dia} />}
        {params.faixa.periodo && (
          <input type="hidden" name="periodo" value={params.faixa.periodo} />
        )}
        {/* Buscar por nome procura na cidade toda; a área do mapa só vale sem texto. */}
        {!params.termo && params.area && (
          <input type="hidden" name="area" value={areaParaTexto(params.area)} />
        )}
        <input type="hidden" name="f" value="1" />
        {perfilConta && params.usarPerfil && <input type="hidden" name="perfil" value="1" />}
        <button type="submit" className="botao shrink-0 px-3 shadow-suave sm:px-5">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 sm:hidden"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only sm:not-sr-only">Buscar</span>
        </button>
      </Form>
      <Filtros params={params} perfilConta={perfilConta} />
    </div>
  );

  return (
    <div className="tela-mapa flex min-h-0 flex-1 flex-col">
      <Suspense>
        <BuscaMapa
          resultados={resultados}
          estimulos={estimulosBusca}
          usarPerfil={!!perfilConta && params.usarPerfil}
          area={params.area}
          resumo={resumo}
          falhou={falhou}
          busca={busca}
          detalhe={detalhe}
          conteudoLugar={conteudoLugar}
          sobre={
            <>
              {sp.conta === "apagada" && (
                <p className="sucesso mb-5" role="status">
                  Sua conta e seus relatos foram apagados.
                </p>
              )}
              <ResumoProjeto />
            </>
          }
        />
      </Suspense>
    </div>
  );
}
