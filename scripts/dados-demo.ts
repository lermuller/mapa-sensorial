/**
 * Dados de demonstração: relatos de exemplo na Brizza Forneria, feitos por uma conta
 * "Exemplo (demonstração)", para ver a página do lugar com blocos preenchidos.
 *
 *   npm run dados-demo              # cria (ou recria) os relatos de exemplo
 *   npm run dados-demo -- --remover # apaga a conta de exemplo e, em cascata, os relatos
 *
 * Precisa de SUPABASE_SECRET_KEY (ver .env.example). Não use em produção com usuários reais
 * sem avisar: os relatos aparecem para todo mundo.
 */

import { createClient } from "@supabase/supabase-js";

const EMAIL_DEMO = "exemplo@mapa-sensorial.invalid";
const NOME_LUGAR = "Brizza Forneria";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.SUPABASE_SECRET_KEY;
if (!url || !chave) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY (ver .env.example).");
  process.exit(1);
}
const supabase = createClient(url, chave, { auth: { persistSession: false } });

async function usuarioDemo() {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email === EMAIL_DEMO) ?? null;
}

async function remover() {
  const usuario = await usuarioDemo();
  if (!usuario) {
    console.log("Não há conta de exemplo. Nada a remover.");
    return;
  }
  const { error } = await supabase.auth.admin.deleteUser(usuario.id);
  if (error) throw error;
  console.log("Conta de exemplo e relatos de demonstração apagados.");
}

async function criar() {
  const { data: lugares, error: erroLugar } = await supabase
    .from("lugares")
    .select("id, nome")
    .eq("nome", NOME_LUGAR)
    .limit(1);
  if (erroLugar) throw erroLugar;
  const lugar = lugares?.[0];
  if (!lugar) throw new Error(`Lugar "${NOME_LUGAR}" não encontrado. Rode antes npm run importar-osm.`);

  let usuario = await usuarioDemo();
  if (!usuario) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL_DEMO,
      email_confirm: true,
      user_metadata: { nome: "Exemplo", nome_publico: "Exemplo (demonstração)" },
    });
    if (error) throw error;
    usuario = data.user;
  }

  // Recria do zero para o script poder rodar de novo sem duplicar.
  await supabase.from("relatos").delete().eq("usuario_id", usuario.id);

  // Som alto, luz baixa (boa) e cheiro médio. Com horários para o "melhor horário":
  // à tarde em dia útil o som é médio, então essa faixa sai como a mais tranquila.
  const base = { lugar_id: lugar.id, usuario_id: usuario.id, luz: 0, cheiro: 1 };
  const relatos = [
    {
      ...base,
      som: 2,
      sempre_assim: true,
      data: null,
      hora: null,
      o_que_esperar:
        "Música ambiente e muita conversa ao mesmo tempo. A luz é baixa e quente, sem telas.",
    },
    {
      ...base,
      som: 2,
      sempre_assim: false,
      data: "2026-10-02",
      hora: "20:30",
      o_que_esperar: "Sexta à noite fica cheio e barulhento. Dá pra pedir mesa mais perto da janela.",
    },
    {
      ...base,
      som: 2,
      sempre_assim: false,
      data: "2026-10-03",
      hora: "21:00",
      o_que_esperar: null,
    },
    {
      ...base,
      som: 1,
      sempre_assim: false,
      data: "2026-10-07",
      hora: "15:00",
      o_que_esperar: "No meio da tarde é bem mais calmo. O cheiro do forno a lenha é forte na entrada.",
    },
  ];
  const { error } = await supabase.from("relatos").insert(relatos);
  if (error) throw error;
  console.log(`${relatos.length} relatos de exemplo criados em ${lugar.nome} (${lugar.id}).`);
}

(process.argv.includes("--remover") ? remover() : criar()).catch((e) => {
  console.error(e);
  process.exit(1);
});
