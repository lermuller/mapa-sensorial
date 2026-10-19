import type { Metadata } from "next";
import Link from "next/link";
import { DocumentoLegal, EmailContato, SecaoLegal } from "@/components/DocumentoLegal";
import { IDADE_MINIMA, RESPONSAVEL } from "@/lib/legal";

export const metadata: Metadata = { title: "Termos de uso" };

const SECOES = [
  { id: "servico", rotulo: "O que é o Mapa Sensorial" },
  { id: "conta", rotulo: "Conta" },
  { id: "regras", rotulo: "Regras para relatos e lugares" },
  { id: "moderacao", rotulo: "Moderação" },
  { id: "conteudo", rotulo: "Seu conteúdo" },
  { id: "informacoes", rotulo: "Sobre as informações do site" },
  { id: "responsabilidade", rotulo: "Disponibilidade e responsabilidade" },
  { id: "encerramento", rotulo: "Encerramento" },
  { id: "privacidade", rotulo: "Privacidade" },
  { id: "mudancas", rotulo: "Mudanças nestes termos" },
  { id: "lei", rotulo: "Lei aplicável e contato" },
];

export default function PaginaTermos() {
  return (
    <DocumentoLegal
      titulo="Termos de uso"
      secoes={SECOES}
      resumo={
        <ul>
          <li>O site é gratuito e feito com a comunidade. Qualquer pessoa consulta sem conta.</li>
          <li>Para relatar é preciso ter conta e {IDADE_MINIMA} anos ou mais.</li>
          <li>
            Relatos falam do <strong>lugar</strong>, não de pessoas: sem ofensas, sem dados pessoais,
            sem propaganda.
          </li>
          <li>Relatos denunciados podem sair do ar até a moderação revisar.</li>
          <li>
            As informações vêm de relatos da comunidade: ajudam a se preparar, mas o lugar pode estar
            diferente no dia.
          </li>
        </ul>
      }
    >
      <SecaoLegal id="servico" numero={1} titulo="O que é o Mapa Sensorial">
        <p>
          O Mapa Sensorial (“como é lá?”) é um site colaborativo e gratuito, mantido por{" "}
          {RESPONSAVEL}, em que pessoas contam como são os estímulos sensoriais (som, luz, cheiro,
          lotação, visual e temperatura) de lugares do Brasil, para que outras pessoas possam
          se preparar antes de ir.
        </p>
        <p>
          Ao criar uma conta ou publicar conteúdo, você concorda com estes termos e com a{" "}
          <Link href="/privacidade">Política de privacidade</Link>. Para só consultar o mapa e os
          relatos, não é preciso conta.
        </p>
      </SecaoLegal>

      <SecaoLegal id="conta" numero={2} titulo="Conta">
        <ul>
          <li>É preciso ter {IDADE_MINIMA} anos ou mais para criar uma conta.</li>
          <li>Cada conta é pessoal e deve usar um e-mail seu. Não use e-mails descartáveis.</li>
          <li>
            O acesso é feito por um código enviado ao seu e-mail. Não compartilhe esse código: quem
            tiver acesso ao seu e-mail consegue entrar na sua conta.
          </li>
          <li>
            Seu nome público aparece nos relatos. Escolha um nome que não ofenda nem se passe por
            outra pessoa.
          </li>
          <li>Você pode apagar sua conta a qualquer momento, na página da conta.</li>
        </ul>
      </SecaoLegal>

      <SecaoLegal id="regras" numero={3} titulo="Regras para relatos e lugares">
        <p>Para o mapa ser útil e seguro para todo mundo, ao publicar você se compromete a:</p>
        <ul>
          <li>relatar uma experiência real sua no lugar, de boa-fé;</li>
          <li>
            falar do <strong>lugar</strong> e dos estímulos, não de pessoas: não identifique
            funcionários, frequentadores ou qualquer outra pessoa;
          </li>
          <li>
            não incluir dados pessoais, seus ou de outras pessoas (e-mail, telefone, documentos,
            endereço, perfis de redes sociais);
          </li>
          <li>
            não publicar ofensas, discriminação de qualquer tipo, capacitismo, ameaças ou conteúdo
            ilegal;
          </li>
          <li>não publicar propaganda, links ou relatos combinados para promover ou prejudicar um lugar;</li>
          <li>adicionar apenas lugares que existem no Brasil, com nome e localização corretos.</li>
        </ul>
        <p>
          Para evitar abusos, cada conta pode publicar até 1 relato por lugar por dia e até 100
          relatos ou avaliações por dia. Avaliações de vários lugares de uma vez também precisam
          ser de visitas reais. Esses limites podem mudar.
        </p>
      </SecaoLegal>

      <SecaoLegal id="moderacao" numero={4} titulo="Moderação">
        <ul>
          <li>
            Os textos passam por um filtro automático que bloqueia dados pessoais, links e palavras
            ofensivas.
          </li>
          <li>
            Qualquer pessoa com conta pode denunciar um relato. Um relato denunciado por duas pessoas
            diferentes fica oculto até ser revisado.
          </li>
          <li>
            Qualquer pessoa com conta pode informar um problema num lugar (fechou, local errado,
            nome errado, repetido, ofensivo). Um lugar apontado como ofensivo por duas pessoas
            diferentes sai do ar até a revisão; apontado como fechado por três pessoas, ganha o aviso
            “Pode ter fechado”.
          </li>
          <li>
            Quem adicionou um lugar pode corrigi-lo ou apagá-lo enquanto ele não tiver relatos de
            outras pessoas. Cada conta pode adicionar até 5 lugares por dia.
          </li>
          <li>
            A moderação pode manter, corrigir, ocultar, arquivar ou remover relatos e lugares que não
            sigam estes termos.
          </li>
          <li>
            Contas que violem estes termos de forma grave ou repetida podem ser suspensas ou
            apagadas.
          </li>
        </ul>
        <p>
          Se você achar que um conteúdo foi removido por engano, ou quiser avisar sobre um conteúdo
          que viola seus direitos, escreva para <EmailContato />.
        </p>
      </SecaoLegal>

      <SecaoLegal id="conteudo" numero={5} titulo="Seu conteúdo">
        <p>
          A autoria dos seus relatos continua sendo sua. Ao publicar, você autoriza o Mapa Sensorial,
          de forma gratuita e não exclusiva, a exibir, reproduzir e organizar esse conteúdo no site,
          inclusive para calcular os resumos de cada lugar e o melhor horário, enquanto ele estiver
          publicado.
        </p>
        <p>
          Os níveis informados nos relatos também entram, somados e sem identificar ninguém, nos{" "}
          <Link href="/dados">dados abertos</Link> do site, que qualquer pessoa pode usar sob a
          licença Creative Commons Atribuição 4.0 (CC BY 4.0), citando o Mapa Sensorial.
        </p>
        <p>
          Você pode editar ou apagar seus relatos a qualquer momento. Ao apagar um relato ou a
          conta, os relatos saem do site e deixam de contar nos resumos.
        </p>
        <p>
          Você é responsável pelo que publica. Não publique conteúdo que viole direitos de outras
          pessoas.
        </p>
      </SecaoLegal>

      <SecaoLegal id="informacoes" numero={6} titulo="Sobre as informações do site">
        <ul>
          <li>
            Os relatos são impressões de pessoas da comunidade. Eles mostram como um lugar
            costuma ser, mas o lugar pode estar diferente no dia da sua visita.
          </li>
          <li>
            As informações do site não são orientação médica, terapêutica ou profissional. A decisão
            de ir a um lugar, e de como se preparar, é sempre sua.
          </li>
          <li>
            Os lugares aparecem a partir de dados públicos do OpenStreetMap e de contribuições das
            pessoas. Aparecer no mapa não significa que o lugar apoia ou participa do projeto.
          </li>
          <li>
            Dados de lugares e mapas ©{" "}
            <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>,
            disponíveis sob a licença ODbL.
          </li>
        </ul>
      </SecaoLegal>

      <SecaoLegal id="responsabilidade" numero={7} titulo="Disponibilidade e responsabilidade">
        <p>
          O site é oferecido gratuitamente e sem garantia de que estará sempre disponível ou livre
          de erros. Podemos mudar, pausar ou remover funcionalidades.
        </p>
        <p>
          Os relatos são publicados pelas pessoas que usam o site, e cada uma responde pelo que
          publica. O Mapa Sensorial remove conteúdos que violem estes termos ou a lei quando tomar
          conhecimento deles, e cumpre as ordens judiciais que receber.
        </p>
      </SecaoLegal>

      <SecaoLegal id="encerramento" numero={8} titulo="Encerramento">
        <p>
          Você pode deixar de usar o site e apagar sua conta quando quiser. Se o projeto for
          encerrado, avisaremos no site com antecedência razoável, e os dados serão apagados
          conforme a <Link href="/privacidade">Política de privacidade</Link>.
        </p>
      </SecaoLegal>

      <SecaoLegal id="privacidade" numero={9} titulo="Privacidade">
        <p>
          Como tratamos seus dados, inclusive o perfil sensorial, está explicado na{" "}
          <Link href="/privacidade">Política de privacidade</Link>.
        </p>
      </SecaoLegal>

      <SecaoLegal id="mudancas" numero={10} titulo="Mudanças nestes termos">
        <p>
          Podemos atualizar estes termos. A data no topo mostra quando a versão atual passou a
          valer. Mudanças importantes serão avisadas no site. Se continuar usando sua conta depois
          disso, você concorda com a nova versão; se não concordar, pode apagar a conta.
        </p>
      </SecaoLegal>

      <SecaoLegal id="lei" numero={11} titulo="Lei aplicável e contato">
        <p>
          Estes termos seguem as leis brasileiras. Fica eleito o foro do seu domicílio para resolver
          qualquer questão sobre eles.
        </p>
        <p>
          Dúvidas, sugestões ou avisos: <EmailContato />.
        </p>
      </SecaoLegal>
    </DocumentoLegal>
  );
}
