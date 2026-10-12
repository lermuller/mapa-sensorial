import type { Metadata } from "next";
import Link from "next/link";
import { DocumentoLegal, EmailContato, SecaoLegal } from "@/components/DocumentoLegal";
import { IDADE_MINIMA, RESPONSAVEL } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de privacidade" };

const SECOES = [
  { id: "quem", rotulo: "Quem cuida dos seus dados" },
  { id: "dados", rotulo: "Quais dados coletamos" },
  { id: "finalidades", rotulo: "Para que usamos e com qual base legal" },
  { id: "perfil", rotulo: "Perfil sensorial: dado sensível" },
  { id: "publico", rotulo: "O que é público e o que não é" },
  { id: "compartilhamento", rotulo: "Com quem os dados são compartilhados" },
  { id: "internacional", rotulo: "Transferência internacional" },
  { id: "cookies", rotulo: "Cookies" },
  { id: "retencao", rotulo: "Por quanto tempo guardamos" },
  { id: "direitos", rotulo: "Seus direitos e como exercê-los" },
  { id: "seguranca", rotulo: "Segurança" },
  { id: "idade", rotulo: "Idade mínima" },
  { id: "mudancas", rotulo: "Mudanças nesta política" },
];

/** Linha da tabela de finalidades. */
function Finalidade({ uso, dados, base }: { uso: string; dados: string; base: string }) {
  return (
    <tr className="border-t border-borda align-top">
      <th scope="row" className="py-2 pr-3 text-left font-bold">
        {uso}
      </th>
      <td className="py-2 pr-3">{dados}</td>
      <td className="py-2">{base}</td>
    </tr>
  );
}

export default function PaginaPrivacidade() {
  return (
    <DocumentoLegal
      titulo="Política de privacidade"
      secoes={SECOES}
      resumo={
        <ul>
          <li>Pedimos só o necessário: e-mail, nome, um nome público e o que você relata.</li>
          <li>
            Seu <strong>perfil sensorial</strong> é opcional, só é guardado com sua autorização e
            nunca aparece para outras pessoas. Você apaga quando quiser.
          </li>
          <li>
            Seus <strong>relatos são públicos</strong>, com seu nome público. Seu e-mail e seu nome
            não aparecem.
          </li>
          <li>Não vendemos dados, não mostramos anúncios e não usamos ferramentas de rastreamento.</li>
          <li>Você pode ver, corrigir e apagar seus dados, inclusive a conta inteira, no próprio site.</li>
        </ul>
      }
    >
      <SecaoLegal id="quem" numero={1} titulo="Quem cuida dos seus dados">
        <p>
          O Mapa Sensorial (“como é lá?”) é um projeto colaborativo e sem fins lucrativos, mantido
          por {RESPONSAVEL}, pessoa física, responsável pelo tratamento dos dados pessoais (o
          “controlador”, nos termos da Lei Geral de Proteção de Dados, Lei nº 13.709/2018, a
          LGPD).
        </p>
        <p>
          Para qualquer assunto sobre seus dados, inclusive para exercer seus direitos, escreva para{" "}
          <EmailContato />. Esse é o canal de atendimento do encarregado pelo tratamento de dados
          pessoais do projeto.
        </p>
      </SecaoLegal>

      <SecaoLegal id="dados" numero={2} titulo="Quais dados coletamos">
        <p>Coletamos apenas o que você nos informa ao usar o site e alguns dados técnicos:</p>
        <ul>
          <li>
            <strong>Conta:</strong> e-mail (para entrar com o código que enviamos), nome, nome
            público (um apelido ou primeiro nome, que aparece nos relatos) e o avatar escolhido.
          </li>
          <li>
            <strong>Perfil sensorial (opcional):</strong> os estímulos a que você é mais sensível
            (som, luz, cheiro, lotação, visual, temperatura) e a data em que você autorizou
            guardá-los. Veja a seção 4.
          </li>
          <li>
            <strong>Relatos:</strong> os níveis de cada estímulo no lugar, se é sempre assim, a data e
            o horário da visita (se você informar) e os textos “O que esperar” e “Comentário”.
          </li>
          <li>
            <strong>Lugares adicionados:</strong> nome, tipo, endereço e localização do lugar, e o
            registro de qual conta o adicionou.
          </li>
          <li>
            <strong>Denúncias:</strong> o motivo informado e qual conta fez a denúncia.
          </li>
          <li>
            <strong>Dados técnicos:</strong> endereço IP, tipo de navegador e horários de acesso,
            registrados automaticamente pelos serviços de hospedagem e de login para o site funcionar
            com segurança.
          </li>
        </ul>
        <p>
          Não pedimos documentos, telefone, endereço, data de nascimento nem diagnóstico. Não
          acessamos a localização do seu aparelho. Para entrar no site não existe senha.
        </p>
      </SecaoLegal>

      <SecaoLegal id="finalidades" numero={3} titulo="Para que usamos e com qual base legal">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <caption className="sr-only">Finalidades do tratamento, dados usados e base legal</caption>
            <thead>
              <tr className="text-left">
                <th scope="col" className="pb-2 pr-3">
                  Para quê
                </th>
                <th scope="col" className="pb-2 pr-3">
                  Quais dados
                </th>
                <th scope="col" className="pb-2">
                  Base legal (LGPD)
                </th>
              </tr>
            </thead>
            <tbody>
              <Finalidade
                uso="Criar e manter sua conta e enviar o código de acesso"
                dados="E-mail, nome, nome público, avatar"
                base="Execução do serviço que você pediu (art. 7º, V)"
              />
              <Finalidade
                uso="Publicar seus relatos e os lugares que você adiciona"
                dados="Relatos, lugares, nome público, avatar"
                base="Execução do serviço (art. 7º, V)"
              />
              <Finalidade
                uso="Personalizar a busca e o melhor horário pelo seu perfil sensorial"
                dados="Perfil sensorial"
                base="Seu consentimento específico e destacado (art. 11, I)"
              />
              <Finalidade
                uso="Moderar conteúdo, limitar envios e evitar abusos (como e-mails descartáveis)"
                dados="Relatos, denúncias, e-mail, dados técnicos"
                base="Legítimo interesse em manter o site seguro e confiável (art. 7º, IX)"
              />
              <Finalidade
                uso="Medir o uso do site (contagens internas) e publicar estatísticas abertas sobre os lugares"
                dados="Níveis, tipo de lugar, data e horário dos relatos; datas de criação e de último acesso das contas"
                base="Legítimo interesse em avaliar e melhorar o projeto e em apoiar estudos (art. 7º, IX)"
              />
              <Finalidade
                uso="Manter o site funcionando e investigar falhas ou ataques"
                dados="Dados técnicos"
                base="Legítimo interesse (art. 7º, IX)"
              />
              <Finalidade
                uso="Cumprir obrigações legais ou ordens de autoridades"
                dados="Os dados exigidos"
                base="Cumprimento de obrigação legal (art. 7º, II)"
              />
            </tbody>
          </table>
        </div>
        <p>
          Os e-mails que enviamos servem só para o acesso à conta. Não enviamos propaganda nem
          newsletter.
        </p>
      </SecaoLegal>

      <SecaoLegal id="perfil" numero={4} titulo="Perfil sensorial: dado sensível">
        <p>
          Saber a que estímulos uma pessoa é sensível pode indicar uma condição de saúde, como
          autismo ou TDAH. Por isso tratamos o perfil sensorial como{" "}
          <strong>dado pessoal sensível</strong> (LGPD, art. 5º, II e art. 11) e com cuidados
          extras:
        </p>
        <ul>
          <li>
            Ele é <strong>opcional</strong>. Sem perfil, você usa o site normalmente e pode escolher
            os filtros de sensibilidade a cada busca, sem guardar nada.
          </li>
          <li>
            Só é guardado com sua <strong>autorização própria</strong>, numa caixa separada do aceite
            destes termos. Registramos a data dessa autorização.
          </li>
          <li>
            É usado <strong>apenas</strong> para ordenar a busca pelos lugares mais confortáveis para
            você e calcular o melhor horário. Não serve para nenhuma outra finalidade.
          </li>
          <li>
            <strong>Nunca aparece para outras pessoas</strong>, não vai junto dos seus relatos e não
            entra no endereço (URL) das páginas.
          </li>
          <li>Não é compartilhado com ninguém, além do serviço de banco de dados (seção 6).</li>
          <li>Não entra nas estatísticas internas nem nos dados abertos do site.</li>
          <li>
            Você pode <strong>retirar a autorização a qualquer momento</strong>, apagando o perfil em{" "}
            <Link href="/perfil">Meu perfil sensorial</Link> ou na página da sua conta. O perfil e o
            registro da autorização são apagados na hora.
          </li>
        </ul>
        <p>
          Os relatos falam do lugar (por exemplo, “o som estava alto”), não de quem relata, e não
          contêm o seu perfil.
        </p>
      </SecaoLegal>

      <SecaoLegal id="publico" numero={5} titulo="O que é público e o que não é">
        <p>
          <strong>Qualquer pessoa pode ver</strong>, mesmo sem conta: seus relatos (níveis, data e
          horário da visita e textos), junto do seu nome público e do seu avatar, e os lugares
          adicionados ao mapa.
        </p>
        <p>
          <strong>Ninguém mais vê:</strong> seu e-mail, seu nome, seu perfil sensorial, as denúncias
          que você fez e quais lugares você adicionou. Pessoas da moderação podem ver as denúncias e
          os relatos denunciados para decidir sobre eles.
        </p>
        <p>
          Também publicamos <Link href="/dados">dados abertos</Link>: estatísticas somadas dos
          relatos, como “em cafés, som alto aparece em X% das avaliações”. Elas usam só os níveis,
          o tipo de lugar, a data e o horário dos relatos, sem nomes, contas, textos ou perfis
          sensoriais, e números com menos de 5 avaliações não aparecem. Para acompanhar o projeto,
          quem o mantém vê também contagens internas, como o número de contas e de relatos por
          semana, sem identificar ninguém.
        </p>
        <p>
          Não coloque nos textos dos relatos informações pessoais suas ou de outras pessoas. O site
          bloqueia e-mails, telefones, documentos e links, mas o cuidado também é seu.
        </p>
      </SecaoLegal>

      <SecaoLegal id="compartilhamento" numero={6} titulo="Com quem os dados são compartilhados">
        <p>
          Não vendemos nem alugamos dados, e não há anúncios no site. Para funcionar, o site usa
          estes serviços, que tratam dados em nosso nome e seguindo nossas instruções (os
          “operadores”):
        </p>
        <ul>
          <li>
            <strong>Supabase</strong>: banco de dados e login. Guarda os dados da conta, o perfil
            sensorial, os relatos e as denúncias, em servidores em São Paulo, Brasil.
          </li>
          <li>
            <strong>Vercel</strong>: hospedagem do site. Processa as páginas e as ações que você faz
            no site e registra dados técnicos de acesso.
          </li>
          <li>
            <strong>Resend</strong>: envio do e-mail com o código de acesso. Recebe seu endereço de
            e-mail.
          </li>
          <li>
            <strong>OpenFreeMap</strong>: imagens do mapa. Ao carregar o mapa, seu navegador pede as
            imagens diretamente a esse serviço, que recebe o endereço IP, mas nenhum dado da sua
            conta.
          </li>
        </ul>
        <p>
          Também podemos compartilhar dados quando a lei exigir ou por ordem de autoridade
          competente, limitando ao que for exigido.
        </p>
      </SecaoLegal>

      <SecaoLegal id="internacional" numero={7} titulo="Transferência internacional">
        <p>
          O banco de dados fica no Brasil, mas Vercel, Resend e OpenFreeMap podem processar dados
          em servidores fora do país, como nos Estados Unidos e na Europa. Essas transferências
          seguem o art. 33 da LGPD e se apoiam nas garantias contratuais de proteção de dados
          oferecidas por esses serviços.
        </p>
      </SecaoLegal>

      <SecaoLegal id="cookies" numero={8} titulo="Cookies">
        <p>Usamos apenas cookies necessários para o site funcionar:</p>
        <ul>
          <li>
            <strong>Sessão:</strong> mantém você conectado depois de entrar com o código.
          </li>
          <li>
            <strong>Aparência:</strong> lembra o tema (claro ou escuro) e o contraste que você
            escolheu.
          </li>
        </ul>
        <p>Não usamos cookies de publicidade, de análise de audiência ou de rastreamento.</p>
      </SecaoLegal>

      <SecaoLegal id="retencao" numero={9} titulo="Por quanto tempo guardamos">
        <ul>
          <li>
            <strong>Conta e relatos:</strong> enquanto a conta existir. Você pode apagar relatos um
            a um, a qualquer momento.
          </li>
          <li>
            <strong>Perfil sensorial:</strong> até você apagá-lo ou apagar a conta.
          </li>
          <li>
            <strong>Ao apagar a conta:</strong> e-mail, nome, nome público, avatar, perfil sensorial
            e todos os seus relatos são apagados na hora. As denúncias que você fez e os lugares que
            você adicionou continuam no site, mas sem ligação com você.
          </li>
          <li>
            <strong>Dados técnicos:</strong> pelo tempo em que os serviços de hospedagem e de login
            guardam seus registros, em geral alguns dias ou semanas.
          </li>
          <li>
            <strong>Cópias de segurança:</strong> dados apagados podem continuar por um período
            curto nas cópias de segurança automáticas do banco de dados, até serem substituídas.
          </li>
        </ul>
        <p>
          Podemos guardar dados por mais tempo quando a lei exigir ou para nos defender em processos.
        </p>
      </SecaoLegal>

      <SecaoLegal id="direitos" numero={10} titulo="Seus direitos e como exercê-los">
        <p>Pela LGPD (art. 18), você pode pedir, a qualquer momento:</p>
        <ul>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
          <li>portabilidade dos seus dados;</li>
          <li>eliminação dos dados tratados com seu consentimento;</li>
          <li>informação sobre com quem compartilhamos seus dados;</li>
          <li>informação sobre a possibilidade de não consentir e suas consequências;</li>
          <li>revogação do consentimento;</li>
          <li>revisão de decisões tomadas só com base em tratamento automatizado.</li>
        </ul>
        <p>
          Muita coisa você mesmo resolve no próprio site: na <Link href="/conta">sua conta</Link>{" "}
          você muda o nome público e o avatar, vê e apaga seus relatos e apaga a conta inteira; em{" "}
          <Link href="/perfil">Meu perfil sensorial</Link> você muda ou apaga o perfil.
        </p>
        <p>
          Para os outros pedidos, escreva para <EmailContato /> a partir do e-mail da sua conta.
          Respondemos em até 15 dias. Se achar que seus direitos não foram respeitados, você também
          pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
      </SecaoLegal>

      <SecaoLegal id="seguranca" numero={11} titulo="Segurança">
        <p>Algumas medidas que usamos para proteger seus dados:</p>
        <ul>
          <li>conexão criptografada (HTTPS) em todo o site;</li>
          <li>login sem senha, por código enviado ao seu e-mail;</li>
          <li>
            regras no banco de dados que permitem a cada pessoa ver e alterar só os próprios dados
            privados;
          </li>
          <li>acesso administrativo restrito ao responsável pelo projeto.</li>
        </ul>
        <p>
          Nenhum sistema é totalmente invulnerável. Se acontecer um incidente de segurança que possa
          trazer risco ou dano relevante, avisaremos as pessoas afetadas e a ANPD, como manda a lei.
        </p>
      </SecaoLegal>

      <SecaoLegal id="idade" numero={12} titulo="Idade mínima">
        <p>
          Para criar uma conta é preciso ter {IDADE_MINIMA} anos ou mais. Qualquer pessoa pode
          consultar o mapa e os relatos sem conta. Se soubermos que uma conta pertence a alguém com
          menos de {IDADE_MINIMA} anos, ela será apagada.
        </p>
      </SecaoLegal>

      <SecaoLegal id="mudancas" numero={13} titulo="Mudanças nesta política">
        <p>
          Podemos atualizar esta política. A data no topo mostra quando a versão atual passou a
          valer. Se uma mudança afetar o uso do seu perfil sensorial ou outro ponto importante,
          avisaremos no site ou por e-mail e, quando a lei exigir, pediremos sua autorização de novo.
        </p>
        <p>
          Veja também os <Link href="/termos">Termos de uso</Link>.
        </p>
      </SecaoLegal>
    </DocumentoLegal>
  );
}
