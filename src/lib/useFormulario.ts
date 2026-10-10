"use client";

import { startTransition, useActionState, type FormEvent } from "react";

/**
 * Como useActionState, mas envia pelo onSubmit. Com `action={...}`, o React limpa os
 * campos depois de cada envio, inclusive quando a resposta é um erro: a pessoa perderia
 * tudo o que digitou. Assim, os campos só mudam quando a página muda.
 */
export function useFormulario<E>(
  acao: (anterior: Awaited<E>, form: FormData) => E | Promise<E>,
  inicial: Awaited<E>,
) {
  const [estado, despachar, pendente] = useActionState(acao, inicial);
  function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Inclui o botão que enviou (name/value), como no envio normal do navegador.
    const botao = (e.nativeEvent as SubmitEvent).submitter;
    const dados = new FormData(e.currentTarget, botao instanceof HTMLButtonElement ? botao : null);
    startTransition(() => despachar(dados));
  }
  return [estado, aoEnviar, pendente] as const;
}
