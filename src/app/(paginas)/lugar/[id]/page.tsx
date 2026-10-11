import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MiniMapa } from "@/components/mapa/MiniMapa";
import { calcularBadges } from "@/lib/calculo";
import { BotaoCompartilhar } from "@/components/BotaoCompartilhar";
import { caminhoLugar, metadadosDoLugar, textoCompartilhar } from "@/lib/compartilhar";
import { obterDetalheLugar, obterLugar, obterPerfil, paraCalculo, relatosDoLugar } from "@/lib/dados";
import { ROTULO_CATEGORIA } from "@/lib/estimulos";
import { formatarData } from "@/lib/formato";
import { usuarioAtualId } from "@/lib/supabase/server";
import { ItemRelato } from "@/components/lugar/ItemRelato";
import { ResumoSensorial } from "@/components/lugar/ResumoSensorial";
import { SemRelatos } from "@/components/lugar/SemRelatos";
import { LinkSeta } from "@/components/LinkSeta";

export async function generateMetadata(props: PageProps<"/lugar/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const detalhe = await obterDetalheLugar(id);
  return detalhe ? metadadosDoLugar(detalhe) : { title: "Lugar não encontrado" };
}

export default async function PaginaLugar(props: PageProps<"/lugar/[id]">) {
  const { id } = await props.params;
  const { aba, enviado } = await props.searchParams;
  const lugar = await obterLugar(id);
  if (!lugar) notFound();

  const [relatos, usuarioId] = await Promise.all([relatosDoLugar(id), usuarioAtualId()]);
  const perfil = usuarioId ? await obterPerfil(usuarioId) : [];
  const agora = new Date();
  // Relatos em revisão (ocultos) não entram nos cálculos.
  const calculo = relatos.filter((r) => !r.oculto).map(paraCalculo);
  const badges = calcularBadges(calculo, agora);
  const abaRelatos = aba === "relatos";

  const oQueEsperar = relatos
    .filter((r) => r.o_que_esperar?.trim())
    .slice(0, 5)
    .map((r) => ({ id: r.id, texto: r.o_que_esperar!, quando: r.criado_em }));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="ajuda">
          <LinkSeta href="/" voltar>Voltar para o mapa</LinkSeta>
        </p>
        <h1 className="display text-4xl">{lugar.nome}</h1>
        <p className="text-texto-suave">
          {ROTULO_CATEGORIA[lugar.categoria]}
          {lugar.endereco && ` · ${lugar.endereco}`}
          {lugar.bairro && ` · ${lugar.bairro}`}
        </p>
        {/* Ação principal à direita */}
        <div className="flex flex-wrap justify-end gap-2">
          <BotaoCompartilhar
            caminho={caminhoLugar(lugar.id)}
            titulo={`${lugar.nome}: como é lá?`}
            texto={textoCompartilhar({ lugar, badges })}
          />
          <Link href={`/lugar/${lugar.id}/relatar`} className="botao">
            Contar como é lá
          </Link>
        </div>
      </header>

      {enviado === "1" && (
        <p className="sucesso" role="status">
          Pronto, seu relato já aparece no lugar.
        </p>
      )}

      <nav aria-label="Seções do lugar" className="flex gap-2 border-b border-borda">
        <Link
          href={`/lugar/${lugar.id}`}
          aria-current={!abaRelatos ? "page" : undefined}
          className={`-mb-px border-b-4 px-3 py-2 font-bold no-underline ${
            !abaRelatos ? "border-destaque text-texto" : "border-transparent"
          }`}
        >
          Resumo
        </Link>
        <Link
          href={`/lugar/${lugar.id}?aba=relatos`}
          aria-current={abaRelatos ? "page" : undefined}
          className={`-mb-px border-b-4 px-3 py-2 font-bold no-underline ${
            abaRelatos ? "border-destaque text-texto" : "border-transparent"
          }`}
        >
          Relatos ({relatos.length})
        </Link>
      </nav>

      {!abaRelatos ? (
        <div className="space-y-6">
          {relatos.length === 0 ? (
            <SemRelatos hrefRelatar={`/lugar/${lugar.id}/relatar`} />
          ) : (
            <ResumoSensorial
              badges={badges}
              relatos={calculo}
              agora={agora.toISOString()}
              perfil={perfil}
              logado={!!usuarioId}
            />
          )}

          <section className="space-y-2">
            <h2 className="text-xl">O que esperar</h2>
            {oQueEsperar.length === 0 ? (
              <p className="ajuda">Ninguém escreveu ainda o que esperar neste lugar.</p>
            ) : (
              <ul className="space-y-2">
                {oQueEsperar.map((o) => (
                  <li key={o.id} className="cartao">
                    <p className="whitespace-pre-line">{o.texto}</p>
                    <p className="ajuda mt-1">Contado em {formatarData(o.quando)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-xl">Onde fica</h2>
            <MiniMapa lat={lugar.lat} lng={lugar.lng} nome={lugar.nome} />
          </section>
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="sr-only">Relatos</h2>
          {relatos.length === 0 ? (
            <SemRelatos hrefRelatar={`/lugar/${lugar.id}/relatar`} />
          ) : (
            <ol className="space-y-3">
              {relatos.map((r) => (
                <li key={r.id}>
                  <ItemRelato relato={r} proprio={r.usuario_id === usuarioId} logado={!!usuarioId} />
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
