"use client";

import type { GeoJSONSource, Map as MapaLibre, PaddingOptions } from "maplibre-gl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import { XDoLink } from "@/components/Carregando";
import { LinkSeta } from "@/components/LinkSeta";
import { criarMapa } from "@/components/mapa/base";
import { pedirLocalizacao } from "@/components/mapa/localizacao";
import type { Area, DetalheLugar, ResultadoBusca, ResultadoExterno } from "@/lib/dados";
import type { Estimulo } from "@/lib/estimulos";
import { CartaoLugar } from "./CartaoLugar";


type Props = {
  resultados: ResultadoBusca[];
  estimulos: Estimulo[];
  /** Área da URL; sem ela, o mapa enquadra os resultados. */
  area: Area | null;
  resumo: string;
  falhou: boolean;
  /** Campo de busca e filtros, flutuando sobre o mapa. */
  busca: ReactNode;
  /** Conteúdo do painel "Sobre o projeto". */
  sobre: ReactNode;
  /** Lugar aberto no painel (?lugar= na URL). */
  detalhe: DetalheLugar | null;
  /** Conteúdo do painel do lugar (resumo, relatos ou contar como é lá), montado no servidor. */
  conteudoLugar: ReactNode;
  /** A busca está usando o perfil sensorial da conta (mantido ao buscar nesta área). */
  usarPerfil: boolean;
  /** Texto buscado: ao buscar, a lista de resultados abre (no celular ela fica recolhida). */
  termoBusca: string;
  /** Lugares do Brasil todo (OpenStreetMap) que ainda não estão na base, para completar a busca. */
  externos: ResultadoExterno[];
};

/**
 * O painel de boas-vindas abre a cada carregamento da página inicial. Ao voltar
 * para ela navegando dentro do site (sem recarregar), ele não reabre.
 */
let boasVindasMostradas = false;

function paraGeoJSON(resultados: (ResultadoBusca | ResultadoExterno)[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: resultados.map((l) => ({
      type: "Feature",
      // Externos levam o endereço que grava e abre o lugar.
      properties: { id: l.id, relatos: l.totalRelatos > 0 ? 1 : 0, href: "href" in l ? l.href : "" },
      geometry: { type: "Point", coordinates: [l.lng, l.lat] },
    })),
  };
}

function telaGrande() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

/**
 * Espaço livre do mapa, descontando a navbar, a busca e o painel aberto. No celular, com a
 * lista aberta (ela ocupa até 70% da altura), os pontos ficam na parte de cima.
 */
function margensDoMapa(listaAberta = false): PaddingOptions {
  if (telaGrande()) return { top: 140, bottom: 60, right: 60, left: 440 };
  const alturaLista = listaAberta ? Math.round(window.innerHeight * 0.7) : 0;
  return { top: 130, bottom: Math.max(110, alturaLista + 24), right: 40, left: 40 };
}

/** Enquadra os resultados no espaço livre do mapa. */
function enquadrar(mapa: MapaLibre, resultados: ResultadoBusca[], listaAberta = false) {
  if (resultados.length === 0) return;
  const lats = resultados.map((l) => l.lat);
  const lngs = resultados.map((l) => l.lng);
  mapa.fitBounds(
    [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    { padding: margensDoMapa(listaAberta), maxZoom: 16, animate: false },
  );
}

export function BuscaMapa({
  resultados,
  estimulos,
  area,
  resumo,
  falhou,
  busca,
  sobre,
  detalhe,
  conteudoLugar,
  usarPerfil,
  termoBusca,
  externos,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const painel = useRef<HTMLOListElement>(null);
  const botaoSobre = useRef<HTMLButtonElement>(null);
  const botaoLista = useRef<HTMLButtonElement>(null);
  const dialogo = useRef<HTMLElement>(null);
  const painelLugar = useRef<HTMLDivElement>(null);
  const tituloLista = useRef<HTMLHeadingElement>(null);
  const mapaRef = useRef<MapaLibre | null>(null);
  const [pronto, setPronto] = useState(false);
  const [erroMapa, setErroMapa] = useState(false);
  // Quem chega por um link de lugar vai direto para ele, sem a janela de boas-vindas.
  const [sobreAberto, setSobreAberto] = useState(() => !boasVindasMostradas && !detalhe);
  const selecionado = detalhe?.lugar.id ?? null;
  const [emFoco, setEmFoco] = useState<string | null>(null);
  const [areaMudou, setAreaMudou] = useState(false);
  const [verLista, setVerLista] = useState(() => termoBusca !== "");
  // Nova busca por texto: mostra os resultados na lista (ajuste durante a renderização).
  const [termoAnterior, setTermoAnterior] = useState(termoBusca);
  if (termoBusca !== termoAnterior) {
    setTermoAnterior(termoBusca);
    if (termoBusca) setVerLista(true);
  }
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Endereço da página inicial com a mesma busca, abrindo (ou fechando) um lugar. Abrir ou
   * fechar sempre volta ao resumo do lugar: a tela interna (relatos, contar como é lá) e o
   * aviso de relato enviado não passam de um lugar para outro.
   */
  function hrefCom(lugarId: string | null) {
    const u = new URLSearchParams(searchParams.toString());
    u.delete("painel");
    u.delete("enviado");
    if (lugarId) u.set("lugar", lugarId);
    else u.delete("lugar");
    const qs = u.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }
  /** Mesma página sem o texto buscado (mantém os filtros). */
  function hrefSemBusca() {
    const u = new URLSearchParams(searchParams.toString());
    for (const k of ["q", "lugar", "painel"]) u.delete(k);
    const qs = u.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }
  // Depois de limpar a busca, o foco vai para o campo, pronto para uma nova busca.
  const limpandoBusca = useRef(false);
  useEffect(() => {
    if (limpandoBusca.current && termoBusca === "") {
      limpandoBusca.current = false;
      document.getElementById("busca")?.focus();
    }
  }, [termoBusca]);

  const abrirLugarRef = useRef<(id: string) => void>(() => {});
  // Clique num ponto do mapa: navegação em transição, para mostrar o aviso "Abrindo lugar…".
  const [abrindoDoMapa, iniciarAberturaDoMapa] = useTransition();
  useEffect(() => {
    abrirLugarRef.current = (id: string) =>
      iniciarAberturaDoMapa(() => router.push(hrefCom(id), { scroll: false }));
  });

  // Cria o mapa uma vez.
  useEffect(() => {
    const controle = new AbortController();
    criarMapa(container.current!, controle.signal)
      .then((mapa) => {
        if (!mapa) return;
        mapaRef.current = mapa;
        mapa.on("load", () => {
          // Verde da marca com contorno escuro. Cor fixa: no tema escuro o canvas do mapa
          // recebe um filtro (globals.css) que já ajusta os tons.
          const cor = "#5ed3a6";
          const contorno = "#0f5c46";
          mapa.addSource("lugares", { type: "geojson", data: paraGeoJSON([]) });
          mapa.addLayer({
            id: "lugares",
            type: "circle",
            source: "lugares",
            paint: {
              "circle-radius": 8,
              "circle-color": cor,
              "circle-opacity": ["case", ["==", ["get", "relatos"], 1], 1, 0.55],
              "circle-stroke-width": 2,
              "circle-stroke-color": contorno,
            },
          });
          // Lugar aberto no painel: fonte própria, porque pode não estar entre os resultados.
          mapa.addSource("lugar-aberto", { type: "geojson", data: paraGeoJSON([]) });
          mapa.addLayer({
            id: "lugar-aberto",
            type: "circle",
            source: "lugar-aberto",
            paint: {
              "circle-radius": 13,
              "circle-color": cor,
              "circle-stroke-width": 4,
              "circle-stroke-color": "#1a1d1c",
            },
          });
          mapa.addLayer({
            id: "lugar-destacado",
            type: "circle",
            source: "lugares",
            filter: ["==", ["get", "id"], ""],
            paint: {
              "circle-radius": 12,
              "circle-color": cor,
              "circle-stroke-width": 3,
              "circle-stroke-color": "#1a1d1c",
            },
          });
          mapa.on("click", "lugares", (e) => {
            const props = e.features?.[0]?.properties;
            if (props?.href) window.location.assign(props.href as string);
            else if (props?.id) abrirLugarRef.current(props.id as string);
          });
          mapa.on("mouseenter", "lugares", () => (mapa.getCanvas().style.cursor = "pointer"));
          mapa.on("mouseleave", "lugares", () => (mapa.getCanvas().style.cursor = ""));
          // Só movimentos feitos pela pessoa (têm originalEvent) oferecem "Buscar nesta área".
          mapa.on("movestart", (e) => {
            if ((e as { originalEvent?: unknown }).originalEvent) setAreaMudou(true);
          });
          setPronto(true);
        });
      })
      .catch((e) => {
        console.error(e);
        setErroMapa(true);
      });
    return () => {
      controle.abort();
      mapaRef.current?.remove();
      mapaRef.current = null;
    };
  }, []);

  // Atualiza os pontos e o enquadramento só quando os resultados mudam de fato
  // (abrir um lugar recarrega a página com a mesma busca; o mapa não deve pular).
  // No mapa entram também os lugares do Brasil todo que completam a busca.
  const noMapa = useMemo(() => [...resultados, ...externos], [resultados, externos]);
  const chaveResultados = useMemo(
    () =>
      noMapa.map((r) => r.id).join(",") +
      "|" +
      (area ? [area.sul, area.oeste, area.norte, area.leste].join(",") : ""),
    [noMapa, area],
  );
  const resultadosRef = useRef<ResultadoBusca[]>(noMapa);
  const verListaRef = useRef(verLista);
  const areaRef = useRef(area);
  const detalheIdRef = useRef<string | null>(detalhe?.lugar.id ?? null);
  useEffect(() => {
    resultadosRef.current = noMapa;
    verListaRef.current = verLista;
    areaRef.current = area;
    detalheIdRef.current = detalhe?.lugar.id ?? null;
  });
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!pronto || !mapa) return;
    const resultados = resultadosRef.current;
    const area = areaRef.current;
    (mapa.getSource("lugares") as GeoJSONSource).setData(paraGeoJSON(resultados));
    setAreaMudou(false);
    // Com um lugar aberto, o enquadramento fica por conta dele.
    if (detalheIdRef.current) return;
    if (area) {
      mapa.fitBounds(
        [
          [area.oeste, area.sul],
          [area.leste, area.norte],
        ],
        { animate: false, padding: 0 },
      );
    } else {
      enquadrar(mapa, resultados, verListaRef.current);
    }
  }, [pronto, chaveResultados]);

  // Lugar aberto: marca no mapa e centraliza, no espaço que o painel deixa livre.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!pronto || !mapa) return;
    const fonte = mapa.getSource("lugar-aberto") as GeoJSONSource;
    if (!detalhe) {
      fonte.setData(paraGeoJSON([]));
      return;
    }
    const { lugar } = detalhe;
    fonte.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { id: lugar.id },
          geometry: { type: "Point", coordinates: [lugar.lng, lugar.lat] },
        },
      ],
    });
    mapa.jumpTo({
      center: [lugar.lng, lugar.lat],
      zoom: Math.max(mapa.getZoom(), 15),
      padding: margensDoMapa(),
    });
  }, [pronto, detalhe]);

  // Destaca no mapa o lugar em foco na lista.
  const destacado = emFoco;
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!pronto || !mapa) return;
    mapa.setFilter("lugar-destacado", ["==", ["get", "id"], destacado ?? ""]);
  }, [pronto, destacado]);

  useEffect(() => {
    boasVindasMostradas = true;
  }, []);

  // Foco (teclado e leitor de tela): cada janela ou painel que abre recebe o foco, e ao
  // fechar ele volta para o botão de onde a pessoa veio. Sem isso o foco cai no topo da página.
  const lugarAberto = detalhe?.lugar.id ?? null;
  const chavePainel = lugarAberto ? `${lugarAberto}|${searchParams.get("painel") ?? ""}` : null;
  const anterior = useRef({ chavePainel, lugarAberto, verLista, sobreAberto: null as boolean | null });
  useEffect(() => {
    const ant = anterior.current;
    anterior.current = { chavePainel, lugarAberto, verLista, sobreAberto };

    // Janela de boas-vindas: foco nela ao abrir (inclusive ao carregar a página).
    if (ant.sobreAberto !== sobreAberto) {
      if (sobreAberto) dialogo.current?.focus();
      else if (ant.sobreAberto !== null) botaoSobre.current?.focus();
      return;
    }
    // Lugar aberto ou outra tela dentro do painel: foco no título.
    if (chavePainel && chavePainel !== ant.chavePainel) {
      const titulo = painelLugar.current?.querySelector("h2");
      if (titulo) {
        titulo.tabIndex = -1;
        titulo.focus({ preventScroll: true });
      }
      return;
    }
    // Painel do lugar fechado: volta para o lugar na lista (ou para o botão da lista, no celular).
    if (!chavePainel && ant.lugarAberto) {
      const cartao = painel.current?.querySelector<HTMLAnchorElement>(
        `[data-id="${ant.lugarAberto}"] a`,
      );
      if (cartao?.checkVisibility()) cartao.focus();
      else botaoLista.current?.focus();
      return;
    }
    // Lista no celular: foco no título ao abrir; no botão "Ver lista" ao fechar.
    if (verLista !== ant.verLista) {
      if (verLista) tituloLista.current?.focus();
      else botaoLista.current?.focus();
    }
  }, [sobreAberto, chavePainel, lugarAberto, verLista]);

  function fecharSobre() {
    setSobreAberto(false);
  }

  /** Teclado na janela de boas-vindas: Esc fecha e o Tab circula só dentro dela. */
  function teclaNoDialogo(e: KeyboardEvent<HTMLElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      fecharSobre();
      return;
    }
    if (e.key !== "Tab" || !dialogo.current) return;
    const focaveis = [
      ...dialogo.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
    ];
    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];
    const ativo = document.activeElement;
    if (e.shiftKey && (ativo === primeiro || ativo === dialogo.current)) {
      e.preventDefault();
      ultimo?.focus();
    } else if (!e.shiftKey && ativo === ultimo) {
      e.preventDefault();
      primeiro?.focus();
    }
  }

  function abrirSobre() {
    setVerLista(false);
    setSobreAberto(true);
  }

  function buscarNestaArea() {
    const mapa = mapaRef.current;
    if (!mapa) return;
    const b = mapa.getBounds();
    const u = new URLSearchParams(searchParams.toString());
    u.set(
      "area",
      [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].map((x) => x.toFixed(4)).join(","),
    );
    u.set("f", "1");
    if (usarPerfil) u.set("perfil", "1");
    router.push(`${pathname}?${u.toString()}`, { scroll: false });
  }

  const [avisoLocal, setAvisoLocal] = useState("");
  const [buscandoLocal, setBuscandoLocal] = useState(false);

  /** "Perto de mim": leva o mapa até a pessoa e mostra os lugares dessa área. */
  async function irParaPerto() {
    const mapa = mapaRef.current;
    if (!mapa) return;
    setAvisoLocal("");
    setBuscandoLocal(true);
    try {
      const { lat, lng } = await pedirLocalizacao();
      mapa.jumpTo({ center: [lng, lat], zoom: 14, padding: margensDoMapa() });
      const b = mapa.getBounds();
      const u = new URLSearchParams(searchParams.toString());
      for (const k of ["q", "lugar", "painel", "enviado"]) u.delete(k);
      u.set(
        "area",
        [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()].map((x) => x.toFixed(4)).join(","),
      );
      u.set("f", "1");
      if (usarPerfil) u.set("perfil", "1");
      router.push(`${pathname}?${u.toString()}`, { scroll: false });
    } catch (e) {
      setAvisoLocal((e as Error).message);
      setTimeout(() => setAvisoLocal(""), 8000);
    } finally {
      setBuscandoLocal(false);
    }
  }

  // Posição dos painéis: folha inferior no celular, coluna à esquerda no computador
  // (abaixo da navbar e da busca).
  const estiloPainel =
    "absolute z-10 flex flex-col overflow-hidden rounded-3xl border border-borda bg-superficie shadow-suave inset-x-2 bottom-2 lg:inset-x-auto lg:left-4 lg:top-[7.75rem] lg:bottom-4";

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <p aria-live="polite" className="sr-only">
        {resumo}
      </p>

      {/* Título da página inicial (só para leitores de tela) */}
      <h1 className="sr-only">Mapa Sensorial: buscar lugares no Brasil</h1>

      {/* Busca e filtros flutuando no topo (escondidos enquanto a janela de boas-vindas está aberta) */}
      {!sobreAberto && (
        <div className="pointer-events-none absolute inset-x-0 top-[4.25rem] z-20 px-2 sm:top-[4.75rem] sm:px-4">
          <div className="pointer-events-auto mx-auto max-w-2xl">{busca}</div>
        </div>
      )}

      {areaMudou && !sobreAberto && (
        <button
          type="button"
          onClick={buscarNestaArea}
          className="botao absolute left-1/2 top-[7.75rem] z-10 -translate-x-1/2 shadow-suave sm:top-[8.25rem]"
        >
          Buscar nesta área
        </button>
      )}

      {/* Painel "Sobre o projeto": aberto ao carregar */}
      {sobreAberto && (
        <section
          ref={dialogo}
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-sobre"
          tabIndex={-1}
          onKeyDown={teclaNoDialogo}
          className="absolute left-1/2 outline-none top-[calc(50%+2rem)] z-30 flex max-h-[calc(100%-5.5rem)] w-[min(40rem,calc(100%-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-borda bg-superficie shadow-suave"
        >
          <button
            type="button"
            onClick={fecharSobre}
            aria-label="Fechar"
            title="Fechar"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-borda bg-superficie text-texto"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {/* Rola só em telas muito baixas; o conteúdo foi pensado para caber sem rolagem. */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4 sm:px-6 sm:pt-5">{sobre}</div>
          {/* Ação principal sempre à direita */}
          <div className="grid grid-cols-2 items-center gap-2 border-t border-borda px-4 py-3 sm:flex sm:px-6">
            <LinkSeta href="/sobre" className="order-last col-span-2 justify-center text-sm sm:order-none sm:mr-auto">
              Mais sobre o projeto
            </LinkSeta>
            <Link href="/perfil" className="botao botao-secundario px-3">
              <span className="sm:hidden">Meu perfil</span>
              <span className="hidden sm:inline">Montar meu perfil sensorial</span>
            </Link>
            <button type="button" onClick={fecharSobre} className="botao px-3">
              Explorar o mapa
            </button>
          </div>
        </section>
      )}

      {/* Lugar aberto: no lugar da lista no computador; folha inferior no celular */}
      {!sobreAberto && detalhe && (
        <section
          aria-label={`Lugar: ${detalhe.lugar.nome}`}
          className={`${estiloPainel} max-h-[75%] lg:max-h-none lg:w-[26rem]`}
        >
          {/* key: cada sub-tela começa do topo */}
          <div
            ref={painelLugar}
            key={`${detalhe.lugar.id}-${searchParams.get("painel") ?? ""}`}
            className="relative flex-1 overflow-y-auto overflow-x-hidden p-4"
          >
            {conteudoLugar}
          </div>
          {/* Fechar: no canto de cima, mas por último no HTML, depois do conteúdo */}
          <Link
            href={hrefCom(null)}
            scroll={false}
            aria-label="Fechar e voltar para a lista"
            title="Fechar"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-borda bg-fundo text-texto"
          >
            <XDoLink />
          </Link>
        </section>
      )}

      {/* Lista: coluna fixa no computador; no celular, quando a pessoa pede a lista */}
      {!sobreAberto && !detalhe && (
        <section
          aria-label="Lista de lugares"
          className={`${estiloPainel} max-h-[70%] lg:flex lg:max-h-none lg:w-[26rem] ${
            verLista ? "" : "hidden"
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-borda px-4 py-2.5">
            <h2
              ref={tituloLista}
              tabIndex={-1}
              className="min-w-0 text-base font-bold leading-normal tracking-normal outline-none"
            >
              {resumo}
            </h2>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setVerLista(false)}
                className="chip min-h-10 lg:hidden"
              >
                Ver mapa
              </button>
              {termoBusca && (
                <Link
                  href={hrefSemBusca()}
                  scroll={false}
                  onClick={() => (limpandoBusca.current = true)}
                  aria-label="Limpar busca"
                  title="Limpar busca"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-borda bg-fundo text-texto"
                >
                  <XDoLink />
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2.5">
            {resultados.length === 0 && externos.length === 0 ? (
              <div className="space-y-2 p-1">
                <p>
                  {falhou
                    ? "Tente de novo em alguns minutos."
                    : "Tente outro nome, outra área do mapa ou menos filtros."}
                </p>
                <p>
                  Não achou o lugar? <Link href="/lugar/novo">Adicione um lugar</Link>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {resultados.length > 0 && (
                  <ol ref={painel} className="space-y-2" aria-label="Resultados">
                    {resultados.map((r) => (
                      <li
                        key={r.id}
                        data-id={r.id}
                        onMouseEnter={() => setEmFoco(r.id)}
                        onMouseLeave={() => setEmFoco(null)}
                        onFocus={() => setEmFoco(r.id)}
                        onBlur={() => setEmFoco(null)}
                      >
                        <CartaoLugar
                          lugar={r}
                          estimulos={estimulos}
                          href={hrefCom(r.id)}
                          selecionado={r.id === selecionado}
                        />
                      </li>
                    ))}
                  </ol>
                )}
                {/* Lugares do Brasil todo (OpenStreetMap) que ainda não estão na base */}
                {externos.length > 0 && (
                  <section aria-labelledby="titulo-externos" className="space-y-2">
                    <div className="px-1">
                      <h3 id="titulo-externos" className="text-[0.9375rem]">
                        {resultados.length > 0 ? "Outros lugares no Brasil" : "Lugares no Brasil"}
                      </h3>
                      <p className="ajuda">Ainda não estão no Mapa Sensorial. Ao abrir, o lugar entra no mapa.</p>
                    </div>
                    <ol className="space-y-2">
                      {externos.map((e) => (
                        <li
                          key={e.id}
                          data-id={e.id}
                          onMouseEnter={() => setEmFoco(e.id)}
                          onMouseLeave={() => setEmFoco(null)}
                          onFocus={() => setEmFoco(e.id)}
                          onBlur={() => setEmFoco(null)}
                        >
                          <CartaoLugar lugar={e} estimulos={estimulos} href={e.href} externo Titulo="h4" />
                        </li>
                      ))}
                    </ol>
                  </section>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {abrindoDoMapa && (
        <p
          role="status"
          className="pointer-events-none absolute left-1/2 top-[7.75rem] z-20 -translate-x-1/2 rounded-full bg-texto px-4 py-2 text-sm font-bold text-fundo shadow-suave sm:top-[8.25rem]"
        >
          Abrindo lugar…
        </p>
      )}

      {avisoLocal && !sobreAberto && (
        <p
          role="alert"
          className="erro absolute inset-x-4 top-[7.75rem] z-20 mx-auto max-w-md text-sm shadow-suave sm:top-[8.25rem]"
        >
          {avisoLocal}
        </p>
      )}

      {/* Botões flutuantes na parte inferior */}
      {!sobreAberto && !verLista && !detalhe && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex flex-wrap justify-center gap-2 px-14 lg:bottom-6">
          <button
            ref={botaoLista}
            type="button"
            onClick={() => setVerLista(true)}
            className="botao pointer-events-auto shadow-suave lg:hidden"
          >
            Ver lista ({resultados.length})
          </button>
          <button
            type="button"
            onClick={irParaPerto}
            disabled={buscandoLocal}
            className="botao botao-secundario pointer-events-auto bg-superficie shadow-suave"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              {/* Mira: símbolo comum de "minha localização" */}
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            {buscandoLocal ? "Localizando…" : "Perto de mim"}
          </button>
          <button
            ref={botaoSobre}
            type="button"
            onClick={abrirSobre}
            className="botao botao-secundario pointer-events-auto bg-superficie shadow-suave"
          >
            Saiba mais sobre o projeto
          </button>
        </div>
      )}

      {/* Mapa em tela cheia, por trás de tudo. Vem por último no HTML: no Tab, a busca e a
          lista chegam antes dos controles do mapa. Inerte enquanto a janela de boas-vindas está aberta. */}
      <div className="absolute inset-0 z-0" inert={sobreAberto}>
        {erroMapa ? (
          <p className="erro m-4 mt-28">Não foi possível carregar o mapa. Use a lista.</p>
        ) : (
          <div
            ref={container}
            className="h-full w-full"
            role="region"
            aria-label="Mapa dos resultados"
          />
        )}
      </div>
    </div>
  );
}
