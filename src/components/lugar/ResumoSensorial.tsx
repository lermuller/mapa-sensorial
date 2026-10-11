import Link from "next/link";
import { Personagem, ROSTO_DO_NIVEL } from "@/components/Personagem";
import {
  calcularFaixas,
  DIAS_FAIXA,
  melhorHorario,
  PERIODOS_FAIXA,
  ROTULO_DIA,
  ROTULO_PERIODO_CURTO,
  type PeriodoFaixa,
  type Badge,
  type RelatoCalculo,
} from "@/lib/calculo";
import {
  COR_ESTIMULO,
  ESTIMULOS,
  INFO_ESTIMULO,
  ROTULO_NIVEL,
  rotuloNivel,
  type Estimulo,
} from "@/lib/estimulos";

const NOME_PERIODO: Record<PeriodoFaixa, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

/** Bloco da grade: fundo na cor do estímulo, nível grande e personagem branco no canto. */
function BlocoEstimulo({ estimulo, badge }: { estimulo: Estimulo; badge: Badge | null }) {
  const nome = INFO_ESTIMULO[estimulo].nome;
  if (!badge) {
    return (
      <div
        className="relative flex min-h-24 flex-col rounded-[20px] bg-fundo p-3"
        style={{ border: "var(--linha) solid var(--borda)" }}
      >
        <span className="text-xs font-bold">{nome}</span>
        <span className="mt-1 text-sm text-texto-suave">Ainda não sabemos</span>
      </div>
    );
  }
  return (
    <div
      className="relative flex min-h-24 flex-col overflow-hidden rounded-[20px] p-3 text-tinta"
      style={{ background: COR_ESTIMULO[estimulo], border: "var(--linha) solid var(--borda)" }}
    >
      <span className="text-xs font-bold">{nome}</span>
      <span className="display mt-1 text-2xl">{rotuloNivel(estimulo, badge.nivel)}</span>
      {badge.poucosRelatos && (
        <span className="mt-1 text-xs">{badge.total === 1 ? "1 relato" : "poucos relatos"}</span>
      )}
      <Personagem
        forma={estimulo}
        rosto={ROSTO_DO_NIVEL[badge.nivel]}
        branco
        className="pointer-events-none absolute -bottom-3 -right-2.5 h-16 w-16"
      />
    </div>
  );
}

export function ResumoSensorial({
  badges,
  relatos,
  agora,
  perfil = [],
  logado = false,
}: {
  badges: Record<Estimulo, Badge | null>;
  relatos: RelatoCalculo[];
  agora: string;
  /** Perfil sensorial em uso (da conta, se a pessoa ativou). Define o melhor horário. */
  perfil?: Estimulo[];
  logado?: boolean;
}) {
  const dataAgora = new Date(agora);

  // Ordem fixa dos estímulos; os sem dados vão para o fim.
  const ordem = [...ESTIMULOS].sort((a, b) => Number(!badges[a]) - Number(!badges[b]));
  const algumBadge = ESTIMULOS.some((e) => badges[e]);

  const melhor = melhorHorario(relatos, dataAgora, perfil);
  const faixas = calcularFaixas(relatos, dataAgora, perfil);

  const porFaixa = new Map(faixas.map((f) => [`${f.dia}-${f.periodo}`, f]));

  return (
    // Grade: o botão de perfil aparece ao lado do título, mas no HTML vem depois dos dados,
    // para o leitor de tela ler primeiro como é o lugar.
    <section aria-labelledby="como-e" className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-3">
      <h2 id="como-e" className="text-xl">
        Como é lá
      </h2>
      {!algumBadge && (
        <p className="ajuda col-span-2">
          Os relatos dos últimos 12 meses não avaliaram nenhum estímulo. Cada estímulo aparece aqui
          assim que alguém conta como ele estava.
        </p>
      )}

      <div className="col-span-2 grid grid-cols-2 gap-2">
        {/* Melhor horário: largura toda, em verde */}
        <div
          className="col-span-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[20px] bg-destaque-suave p-3"
          style={{ border: "var(--linha) solid var(--borda)" }}
        >
          <span className="text-xs font-bold">
            Melhor horário
            {perfil.length > 0 && <span className="font-normal"> para o seu perfil</span>}
          </span>
          {melhor ? (
            <span className="text-lg font-extrabold tracking-[-0.03em]">
              {ROTULO_DIA[melhor.dia]} {ROTULO_PERIODO_CURTO[melhor.periodo]}
            </span>
          ) : (
            <span className="text-sm">Ainda sem relatos com horário suficientes</span>
          )}
        </div>

        <ul className="contents" aria-label="Estímulos">
          {ordem.map((e) => (
            <li key={e} className="contents">
              <BlocoEstimulo estimulo={e} badge={badges[e]} />
            </li>
          ))}
        </ul>
      </div>

      {faixas.length > 0 && (
        <section aria-labelledby="ao-longo" className="col-span-2 space-y-2 pt-1">
          <h3 id="ao-longo" className="text-base">
            Ao longo da semana
          </h3>
          {DIAS_FAIXA.map((dia) => (
            <div key={dia} className="space-y-1">
              <p className="text-sm font-bold">{ROTULO_DIA[dia]}</p>
              <ul className="grid grid-cols-3 gap-1.5">
                {PERIODOS_FAIXA.map((periodo) => {
                  const f = porFaixa.get(`${dia}-${periodo}`);
                  const ehMelhor = melhor?.dia === dia && melhor?.periodo === periodo;
                  return (
                    <li
                      key={periodo}
                      className={`flex min-h-16 flex-col justify-between rounded-2xl p-2 ${
                        ehMelhor ? "bg-destaque-suave" : f ? "bg-fundo" : "border border-dashed border-borda"
                      }`}
                      style={ehMelhor || f ? { border: "var(--linha) solid var(--borda)" } : undefined}
                    >
                      <span className="flex items-center justify-between gap-1 text-xs text-texto-suave">
                        {NOME_PERIODO[periodo]}
                        {ehMelhor && <span className="font-bold text-texto">Melhor</span>}
                      </span>
                      {f ? (
                        <span>
                          <span className="block font-extrabold leading-tight tracking-[-0.02em]">
                            {ROTULO_NIVEL[f.nivel]}
                          </span>
                          <span className="text-xs text-texto-suave">
                            {f.total} {f.total === 1 ? "relato" : "relatos"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-texto-suave">Sem dados</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}
      {/* Botão terciário: personalizar pelo perfil sensorial */}
      <Link href={logado ? "/perfil" : "/cadastro"} className="botao-terciario col-start-2 row-start-1">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
          {perfil.length > 0 ? (
            <>
              {/* Ajustar: controles deslizantes */}
              <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
              <circle cx="16" cy="7" r="2" />
              <circle cx="10" cy="17" r="2" />
            </>
          ) : (
            /* Criar: mais */
            <path d="M12 5v14M5 12h14" />
          )}
        </svg>
        {perfil.length > 0
          ? "Ajustar meu perfil"
          : logado
            ? "Montar meu perfil sensorial"
            : "Criar perfil sensorial"}
      </Link>
    </section>
  );
}
