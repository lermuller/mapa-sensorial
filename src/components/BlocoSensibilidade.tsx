import { BlocoOpcao } from "@/components/BlocoOpcao";
import { COR_ESTIMULO, INFO_ESTIMULO, type Estimulo } from "@/lib/estimulos";

/** Bloco selecionável de sensibilidade (filtros, cadastro e perfil). */
export function BlocoSensibilidade({
  estimulo,
  defaultChecked,
  name,
}: {
  estimulo: Estimulo;
  defaultChecked: boolean;
  /** Nome do campo no formulário ("sens" nos filtros, "perfil" no perfil). */
  name: string;
}) {
  return (
    <BlocoOpcao
      name={name}
      value={estimulo}
      defaultChecked={defaultChecked}
      cor={COR_ESTIMULO[estimulo]}
      personagem={{ forma: estimulo, rosto: "calmo" }}
      className="min-h-22"
    >
      {INFO_ESTIMULO[estimulo].nome}
    </BlocoOpcao>
  );
}
