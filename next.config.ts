import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Renderização dinâmica comum: quase toda página depende de sessão ou do banco,
  // e preferimos a página pronta de uma vez a placeholders que mudam o layout.
  cacheComponents: false,
  experimental: {
    // O cache em disco do Turbopack no dev às vezes servia uma versão antiga do globals.css.
    turbopackFileSystemCacheForDev: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
