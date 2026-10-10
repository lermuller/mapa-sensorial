// Páginas internas: largura de leitura e rodapé. A página inicial (mapa) ocupa a tela toda, sem rodapé.
export default function LayoutPaginas({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* pt: espaço da navbar flutuante */}
      <div className="mx-auto w-full max-w-4xl flex-1 px-4 pb-6 pt-20 sm:pt-24">{children}</div>
      <footer className="border-t border-borda px-4 py-6 text-sm text-texto-suave">
        <div className="mx-auto max-w-4xl space-y-1">
          <p>
            Mapa Sensorial · Porto Alegre. Feito com a comunidade autista. Os relatos descrevem os
            lugares, não as pessoas.
          </p>
          <p>
            Dados de lugares e mapas ©{" "}
            <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>.
          </p>
        </div>
      </footer>
    </>
  );
}
