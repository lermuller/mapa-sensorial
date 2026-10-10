import { redirect } from "next/navigation";

// A busca agora é a página inicial. Mantém links antigos funcionando.
export default async function PaginaBusca(props: PageProps<"/buscar">) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(await props.searchParams)) {
    (Array.isArray(v) ? v : [v]).forEach((x) => x !== undefined && params.append(k, x));
  }
  const qs = params.toString();
  redirect(qs ? `/?${qs}` : "/");
}
