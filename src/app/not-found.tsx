import { LinkSeta } from "@/components/LinkSeta";

export default function NaoEncontrado() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl">Página não encontrada</h1>
      <p>Esta página não existe ou foi apagada.</p>
      <p>
        <LinkSeta href="/" voltar>Voltar para o mapa</LinkSeta>
      </p>
    </div>
  );
}
