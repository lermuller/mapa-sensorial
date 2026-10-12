import Link from "next/link";

// Páginas internas: largura de leitura e rodapé. A página inicial (mapa) ocupa a tela toda, sem rodapé.
export default function LayoutPaginas({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* pt: espaço da navbar flutuante */}
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 pb-6 pt-20 sm:pt-24">{children}</div>
      <footer className="border-t border-borda px-4 py-6 text-sm text-texto-suave">
        <div className="mx-auto max-w-4xl space-y-1">
          <p>
            Mapa Sensorial · feito em Porto Alegre, para o Brasil todo. Feito com a comunidade autista. Os relatos descrevem os
            lugares, não as pessoas.
          </p>
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/sobre">Sobre o projeto</Link>
            <Link href="/dados">Dados abertos</Link>
            <Link href="/termos">Termos de uso</Link>
            <Link href="/privacidade">Política de privacidade</Link>
          </nav>
          <p>
            Dados de lugares e mapas ©{" "}
            <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>.
          </p>
        </div>
      </footer>
    </>
  );
}
