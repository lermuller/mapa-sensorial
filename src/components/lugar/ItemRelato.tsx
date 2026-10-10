import Link from "next/link";
import type { Relato } from "@/lib/dados";
import { Avatar } from "@/components/Avatar";
import { BadgeSensorial } from "@/components/BadgeSensorial";
import { ESTIMULOS, NIVEIS } from "@/lib/estimulos";
import { formatarData, formatarQuando } from "@/lib/formato";

export function ItemRelato({
  relato,
  proprio,
  logado,
}: {
  relato: Relato;
  proprio: boolean;
  logado: boolean;
}) {
  const avaliados = ESTIMULOS.filter((e) => relato[e] !== null);
  return (
    <article className="cartao space-y-2.5 bg-fundo text-sm">
      {relato.oculto && (
        <p className="erro text-xs" role="note">
          Em revisão: este relato recebeu denúncias e só você está vendo. A moderação vai olhar.
        </p>
      )}
      <header className="flex items-start gap-2.5">
        <Avatar valor={relato.avatar} className="h-9 w-9" />
        <div className="min-w-0">
          <p>
            <strong>{relato.nome_publico}</strong>
            {proprio && <span className="ajuda"> (você)</span>}
          </p>
          <p className="ajuda">
            {relato.sempre_assim
              ? "É sempre assim"
              : relato.data && `Foi ${formatarQuando(relato.data, relato.hora)}`}
            {" · "}contado em {formatarData(relato.criado_em)}
            {relato.editado_em && " · editado"}
          </p>
        </div>
      </header>

      <ul className="flex flex-wrap gap-1" aria-label="Como estava">
        {avaliados.map((e) => (
          <li key={e}>
            <BadgeSensorial
              compacto
              badge={{
                estimulo: e,
                nivel: NIVEIS[relato[e]!],
                media: relato[e]!,
                total: 1,
                poucosRelatos: false,
              }}
            />
          </li>
        ))}
      </ul>

      {relato.o_que_esperar && (
        <div>
          <h3 className="font-bold">O que esperar</h3>
          <p className="whitespace-pre-line">{relato.o_que_esperar}</p>
        </div>
      )}
      {relato.comentario && (
        <div>
          <h3 className="font-bold">Comentário</h3>
          <p className="whitespace-pre-line">{relato.comentario}</p>
        </div>
      )}

      <footer className="flex flex-wrap gap-4 pt-1 text-sm">
        {proprio ? (
          <>
            <Link href={`/relato/${relato.id}/editar`}>Editar</Link>
            <Link href={`/relato/${relato.id}/apagar`}>Apagar</Link>
          </>
        ) : (
          <Link
            href={
              logado
                ? `/relato/${relato.id}/denunciar`
                : `/entrar?voltar=${encodeURIComponent(`/relato/${relato.id}/denunciar`)}`
            }
          >
            Denunciar
          </Link>
        )}
      </footer>
    </article>
  );
}
