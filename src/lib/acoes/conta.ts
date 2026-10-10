"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { avatarValido } from "@/lib/avatar";
import { env } from "@/lib/env";
import { ehEstimulo, type Estimulo } from "@/lib/estimulos";
import { IDADE_MINIMA } from "@/lib/legal";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor, usuarioAtualId } from "@/lib/supabase/server";

export type EstadoConta = { erro?: string; enviadoPara?: string; ok?: boolean };

/** Só caminhos internos, para não virar redirecionamento aberto. */
function caminhoSeguro(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/";
}

function urlDeRetorno(voltar: string) {
  return `${env.siteUrl}/auth/callback?voltar=${encodeURIComponent(voltar)}`;
}

const email = z.email({ message: "Digite um e-mail válido." }).max(254);

const esquemaCadastro = z.object({
  nome: z.string().trim().min(1, "Digite seu nome.").max(120),
  nome_publico: z
    .string()
    .trim()
    .min(1, "Digite o nome público.")
    .max(40, "O nome público pode ter até 40 caracteres."),
  email,
});

export async function cadastrar(_a: EstadoConta, form: FormData): Promise<EstadoConta> {
  const r = esquemaCadastro.safeParse({
    nome: form.get("nome") ?? "",
    nome_publico: form.get("nome_publico") ?? "",
    email: String(form.get("email") ?? "").trim(),
  });
  if (!r.success) return { erro: r.error.issues[0]?.message };
  if (form.get("aceite") !== "on") {
    return { erro: `Para criar a conta, é preciso ter ${IDADE_MINIMA} anos ou mais e concordar com os termos.` };
  }
  // E-mails descartáveis são barrados no banco; aqui só damos a mensagem certa.
  if (await emailDescartavel(r.data.email)) {
    return { erro: "Use um e-mail pessoal: não aceitamos e-mails temporários." };
  }
  // Perfil sensorial é opcional; com estímulos marcados, exige autorização própria.
  const perfil = lerEstimulosDoForm(form);
  const consentiu = form.get("consentimento") === "on";
  if (perfil.length > 0 && !consentiu) {
    return { erro: "Para guardar seu perfil sensorial, marque a autorização. Ou deixe o perfil em branco." };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email: r.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: urlDeRetorno(caminhoSeguro(form.get("voltar"))),
      data: {
        nome: r.data.nome,
        nome_publico: r.data.nome_publico,
        // O gatilho do banco copia para a conta e apaga daqui (ver migração perfil_na_conta).
        ...(perfil.length > 0 && consentiu
          ? { perfil_sensorial: perfil, perfil_consentido: true }
          : {}),
      },
    },
  });
  if (error) {
    console.error(error);
    return { erro: "Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos." };
  }
  return { enviadoPara: r.data.email };
}

export async function entrar(_a: EstadoConta, form: FormData): Promise<EstadoConta> {
  const r = email.safeParse(String(form.get("email") ?? "").trim());
  if (!r.success) return { erro: r.error.issues[0]?.message };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email: r.data,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: urlDeRetorno(caminhoSeguro(form.get("voltar"))),
    },
  });
  // Quando o e-mail não tem conta, o Supabase devolve erro. Não contamos isso
  // para não revelar quem tem conta; a mensagem de sucesso explica as duas situações.
  if (error && error.status !== 422 && error.code !== "otp_disabled") {
    console.error(error);
    if (error.status === 429) {
      return { erro: "Muitos pedidos seguidos. Espere alguns minutos e tente de novo." };
    }
    // Falha do serviço de e-mail ou tempo esgotado: o código não saiu, então não seguimos.
    return { erro: "Não conseguimos enviar o e-mail agora. Tenta de novo daqui a pouco?" };
  }
  return { enviadoPara: r.data };
}

export async function sair(): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}

export async function atualizarNomePublico(_a: EstadoConta, form: FormData): Promise<EstadoConta> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect("/entrar?voltar=/conta");
  const r = esquemaCadastro.shape.nome_publico.safeParse(form.get("nome_publico") ?? "");
  if (!r.success) return { erro: r.error.issues[0]?.message };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("usuarios")
    .update({ nome_publico: r.data })
    .eq("id", usuarioId);
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Apaga a conta e, em cascata, os relatos da pessoa. */
export async function apagarConta(_a: EstadoConta, form: FormData): Promise<EstadoConta> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect("/entrar?voltar=/conta");
  if (String(form.get("confirmacao") ?? "").trim().toUpperCase() !== "APAGAR") {
    return { erro: "Digite APAGAR para confirmar." };
  }

  const admin = criarClienteAdmin();
  const { error } = await admin.auth.admin.deleteUser(usuarioId);
  if (error) {
    console.error(error);
    return { erro: "Não foi possível apagar a conta agora. Tente de novo." };
  }
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/?conta=apagada");
}

/** Estímulos marcados num formulário (campo "perfil", vários valores). */
function lerEstimulosDoForm(form: FormData): Estimulo[] {
  return [...new Set(form.getAll("perfil").map(String))].filter(ehEstimulo);
}

/**
 * Salva o perfil sensorial na conta. Exige o consentimento específico quando há
 * estímulos marcados (dado sensível, LGPD art. 11).
 */
export async function salvarPerfil(_a: EstadoConta, form: FormData): Promise<EstadoConta> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect("/entrar?voltar=/perfil");
  const perfil = lerEstimulosDoForm(form);
  if (perfil.length > 0 && form.get("consentimento") !== "on") {
    return { erro: "Para guardar o perfil na sua conta, marque a autorização." };
  }
  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("usuarios")
    .update({
      perfil_sensorial: perfil,
      perfil_consentido_em: perfil.length > 0 ? new Date().toISOString() : null,
    })
    .eq("id", usuarioId);
  if (error) {
    console.error(error);
    return { erro: "Não deu para salvar seu perfil agora. Tenta de novo?" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Apaga o perfil sensorial da conta (e o registro do consentimento). */
export async function apagarPerfil(form: FormData): Promise<void> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect("/entrar?voltar=/perfil");
  const supabase = await criarClienteServidor();
  await supabase
    .from("usuarios")
    .update({ perfil_sensorial: [], perfil_consentido_em: null })
    .eq("id", usuarioId);
  revalidatePath("/", "layout");
  const voltar = form.get("voltar") === "/conta" ? "/conta" : "/perfil";
  redirect(`${voltar}?apagado=1`);
}

/** O domínio do e-mail está na lista de descartáveis (tabela dominios_bloqueados). */
async function emailDescartavel(email: string): Promise<boolean> {
  const dominio = email.split("@")[1]?.toLowerCase();
  if (!dominio || !env.supabaseSecretKey) return false;
  const { data } = await criarClienteAdmin()
    .from("dominios_bloqueados")
    .select("dominio")
    .eq("dominio", dominio)
    .maybeSingle();
  return !!data;
}

/**
 * Confere o código enviado por e-mail (login e cadastro). Com o código, a pessoa entra
 * em qualquer navegador, sem depender de abrir um link no mesmo aparelho.
 */
export async function verificarCodigo(_a: EstadoConta, form: FormData): Promise<EstadoConta> {
  const email = String(form.get("email") ?? "").trim();
  const codigo = String(form.get("codigo") ?? "").replace(/\D/g, "");
  if (!/^\d{6,10}$/.test(codigo)) {
    return { erro: "Digite o código de números que chegou no seu e-mail.", enviadoPara: email };
  }
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "email" });
  if (error) {
    if (error.status === 429) {
      return { erro: "Muitas tentativas seguidas. Espere alguns minutos.", enviadoPara: email };
    }
    return {
      erro: "Esse código não funcionou. Confira os números ou peça um novo.",
      enviadoPara: email,
    };
  }
  redirect(caminhoSeguro(form.get("voltar")));
}

/** Troca o avatar (uma das opções de src/lib/avatar.ts). */
export async function salvarAvatar(_a: EstadoConta, form: FormData): Promise<EstadoConta> {
  const usuarioId = await usuarioAtualId();
  if (!usuarioId) redirect("/entrar?voltar=/conta");
  const avatar = String(form.get("avatar") ?? "");
  if (!avatarValido(avatar)) return { erro: "Escolha um dos avatares." };
  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("usuarios").update({ avatar }).eq("id", usuarioId);
  if (error) return { erro: "Não deu para salvar o avatar agora. Tenta de novo?" };
  revalidatePath("/", "layout");
  return { ok: true };
}
