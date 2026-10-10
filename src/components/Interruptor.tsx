import type { ReactNode } from "react";

/**
 * Interruptor liga/desliga. É um checkbox de verdade (role="switch"), então funciona
 * sem JavaScript e com teclado; o estado aparece no trilho e também escrito ao lado.
 */
export function Interruptor({
  name,
  value = "1",
  defaultChecked,
  children,
}: {
  name: string;
  value?: string;
  defaultChecked?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="group/int inline-flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        role="switch"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      {/* Trilho e bolinha */}
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-[var(--borda-campo)] peer-checked:bg-destaque peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--foco)]"
        style={{ border: "var(--linha) solid var(--texto)" }}
      >
        <span className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-fundo shadow-suave group-has-checked/int:translate-x-5" style={{ border: "var(--linha) solid var(--texto)" }} />
      </span>
      <span className="font-medium">
        {children}
        {/* Estado escrito só para quem vê: o leitor de tela já anuncia ligado/desligado */}
        <span aria-hidden="true" className="ml-2 text-xs font-bold text-texto-suave group-has-checked/int:hidden">
          Desligado
        </span>
        <span aria-hidden="true" className="ml-2 hidden text-xs font-bold text-verde-titulo group-has-checked/int:inline">
          Ligado
        </span>
      </span>
    </label>
  );
}
