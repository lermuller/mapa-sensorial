// Variáveis de ambiente (ver .env.example).

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** E-mail de contato mostrado em /sobre. Sem ele, a página diz que o contato vem em breve. */
  emailContato: process.env.NEXT_PUBLIC_EMAIL_CONTATO ?? "",
};
