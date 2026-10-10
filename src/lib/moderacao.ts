// Filtro dos textos livres dos relatos ("O que esperar" e "Comentário").
// Barra o mais comum em relatos mal-intencionados: dados pessoais, links e ofensas.
// Não substitui a moderação: relatos denunciados por 2 pessoas saem do ar até revisão.

/** Palavras e expressões ofensivas (sem acento, minúsculas). Revisar com a comunidade. */
const OFENSAS = [
  "idiota", "imbecil", "retardado", "retardada", "mongol", "mongoloide", "debil mental",
  "aleijado", "aleijada", "doente mental", "maluco de pedra", "louco de pedra",
  "burro", "burra", "otario", "otaria", "babaca", "escroto", "escrota", "lixo humano",
  "vagabundo", "vagabunda", "puta", "puto", "piranha", "viado", "bicha", "sapatao",
  "traveco", "crioulo", "crioula", "preto imundo", "judeu sujo",
  "nazista", "caralho", "porra", "merda", "bosta", "cu", "foder", "fodase", "foda-se",
  "filho da puta", "fdp", "vai tomar no", "arrombado", "arrombada", "corno", "corna",
  "desgracado", "desgracada", "autista de merda", "autismo e frescura", "frescura de autista",
];

/** Tira acentos, passa para minúsculas e desfaz trocas comuns (1→i, 0→o, 3→e, 4→a). */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/(.)\1{2,}/g, "$1"); // letras repetidas: "idiotaaa" → "idiota"
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const LINK = /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:com|com\.br|net|org|br|io|me|ly)(?:\/\S*)?\b/i;
// CPF formatado, ou 11 dígitos logo depois da palavra "CPF" (sem isso, 11 dígitos = celular).
const CPF = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|cpf\D{0,5}\d{11}\b/i;
// Telefone: 8 a 11 dígitos, com ou sem DDD, espaços, pontos, traços e parênteses.
const TELEFONE = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[\s.-]?\d{4}\b/;
const PERFIL = /(?:^|\s)@[a-z0-9_.]{3,}/i;

export type ProblemaTexto = "email" | "telefone" | "cpf" | "link" | "perfil" | "ofensa";

const MENSAGENS: Record<ProblemaTexto, string> = {
  email: "Tira o e-mail do texto: os relatos são públicos.",
  telefone: "Tira o número de telefone do texto: os relatos são públicos.",
  cpf: "Tira o número de documento do texto: os relatos são públicos.",
  link: "Não dá para colocar links nos relatos.",
  perfil: "Não dá para marcar perfis de redes sociais nos relatos.",
  ofensa:
    "Tem uma palavra ofensiva no texto. Conta como é o lugar sem ofender ninguém, por favor.",
};

/** Primeiro problema encontrado no texto, ou null se estiver tudo certo. */
export function problemaNoTexto(texto: string | null | undefined): ProblemaTexto | null {
  if (!texto?.trim()) return null;
  if (EMAIL.test(texto)) return "email";
  if (CPF.test(texto)) return "cpf";
  if (TELEFONE.test(texto)) return "telefone";
  if (LINK.test(texto)) return "link";
  if (PERFIL.test(texto)) return "perfil";
  // Texto normalizado, só letras e espaços; procura cada ofensa como palavra inteira
  // (assim "cumprimenta" não é confundido com uma ofensa curta).
  const limpo = ` ${normalizar(texto).replace(/[^a-z\s-]/g, " ").replace(/\s+/g, " ")} `;
  if (OFENSAS.some((o) => limpo.includes(` ${o.trim()} `))) return "ofensa";
  return null;
}

export function mensagemDoProblema(p: ProblemaTexto): string {
  return MENSAGENS[p];
}
