import { Personagem, type FormaPadrao, type Rosto } from "@/components/Personagem";
import { ESTIMULOS, INFO_ESTIMULO } from "@/lib/estimulos";

const PASSOS: { titulo: string; texto: string; forma: FormaPadrao; rosto: Rosto }[] = [
  {
    titulo: "Busque um lugar",
    texto: "Pelo nome, endereço ou bairro, ou explorando o mapa.",
    forma: "bolha",
    rosto: "curioso",
  },
  {
    titulo: "Veja o que esperar",
    texto: "Como costumam ser os estímulos e o horário mais tranquilo para ir.",
    forma: "bloco",
    rosto: "calmo",
  },
  {
    titulo: "Conte como foi",
    texto: "Seu relato ajuda outra pessoa a se preparar.",
    forma: "octogono",
    rosto: "feliz",
  },
];

/**
 * Conteúdo do painel de boas-vindas: o que é, como usar e os estímulos, curto o
 * bastante para caber sem rolagem. O restante fica na página /sobre.
 */
export function ResumoProjeto() {
  return (
    <div className="space-y-4 text-[0.9375rem] sm:space-y-5">
      <header className="space-y-1.5 pr-10">
        <h2 id="titulo-sobre" className="display text-[1.65rem] sm:text-3xl">
          Mapa Sensorial, <span className="text-verde-titulo">como é lá?</span>
        </h2>
        <p className="pt-1 text-sm sm:text-[0.9375rem]">
          Antes de ir a um lugar, veja como costumam ser o barulho, a luz, os cheiros e o
          movimento por lá. Quem já foi conta, e a gente se prepara junto.
        </p>
      </header>

      <section aria-labelledby="como-usar" className="space-y-2">
        <h3 id="como-usar" className="text-base">
          Como usar
        </h3>
        <ol className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {PASSOS.map((p, i) => (
            <li
              key={p.titulo}
              className="flex flex-col gap-1 rounded-2xl bg-fundo p-2.5 sm:p-3"
              style={{ border: "var(--linha) solid var(--borda)" }}
            >
              <span className="flex items-center gap-1.5">
                <Personagem forma={p.forma} rosto={p.rosto} className="h-9 w-9 sm:h-11 sm:w-11" />
                <span aria-hidden="true" className="display text-2xl text-verde-titulo sm:text-3xl">
                  {i + 1}
                </span>
              </span>
              <span className="text-sm">
                <strong className="block leading-tight">
                  <span className="sr-only">Passo {i + 1}: </span>
                  {p.titulo}
                </strong>
                <span className="mt-0.5 hidden text-texto-suave sm:block">{p.texto}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="estimulos-resumo" className="space-y-2">
        <h3 id="estimulos-resumo" className="text-base">
          O que as pessoas avaliam
        </h3>
        <ul className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {ESTIMULOS.map((e) => (
            <li
              key={e}
              className="flex flex-col items-center gap-0.5 rounded-2xl bg-fundo px-1 py-1.5 text-center sm:flex-row sm:gap-2 sm:p-2.5 sm:text-left"
              style={{ border: "var(--linha) solid var(--borda)" }}
            >
              <Personagem forma={e} rosto="calmo" className="h-9 w-9 sm:h-14 sm:w-14" />
              <span className="min-w-0">
                <strong className="block text-[0.8125rem] leading-tight sm:text-base">
                  {INFO_ESTIMULO[e].nome}
                </strong>
                <span className="hidden text-xs leading-snug text-texto-suave sm:block">
                  {INFO_ESTIMULO[e].cobre}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
