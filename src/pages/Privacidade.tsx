import { Link } from 'react-router-dom';
import PaginaTexto from '../components/PaginaTexto';
import { CONTATO } from '../lib/constants';

export default function Privacidade() {
  return (
    <PaginaTexto titulo="Política de Privacidade" atualizadoEm="11/11/2026">
      <section>
        <p>
          O Pet Care RS é um projeto acadêmico e voluntário, desenvolvido nas Atividades Extensionistas do curso de Ciência da
          Computação da UNINTER, que conecta organizações de proteção animal, adotantes, voluntários e tutores de animais
          desaparecidos no Vale do Sinos/RS. Esta política explica, de acordo com a Lei Geral de Proteção de Dados (Lei nº
          13.709/2018, LGPD), quais dados coletamos, para quê e quais são os seus direitos.
        </p>
      </section>

      <section>
        <h2>1. Quem é o responsável pelos dados</h2>
        <p>
          O controlador dos dados é o responsável pelo projeto, Ismael Hannecker Alcantara Ferreira. Contato para assuntos de
          privacidade: <a href={`mailto:${CONTATO.email}`}>{CONTATO.email}</a>.
        </p>
      </section>

      <section>
        <h2>2. Quais dados coletamos</h2>
        <ul>
          <li><strong>Conta:</strong> nome, e-mail e senha (armazenada de forma criptografada) ou os dados básicos da sua conta Google, se você entrar com ela.</li>
          <li><strong>Perfil:</strong> telefone, cidade e preferências de notificação, quando você os informa.</li>
          <li><strong>Solicitações de adoção e lar temporário:</strong> as respostas do formulário (moradia, espaço, outros animais, disponibilidade e motivação).</li>
          <li><strong>Voluntariado:</strong> as inscrições e a mensagem que você enviar.</li>
          <li><strong>Animais desaparecidos:</strong> dados e fotos do animal, local e data do desaparecimento.</li>
          <li><strong>Mensagens:</strong> perguntas e informações enviadas sobre animais, com o contato de retorno que você escolher informar, e mensagens do formulário de contato.</li>
          <li><strong>Dados técnicos:</strong> estatísticas de acesso agregadas e anônimas (páginas visitadas, tipo de dispositivo), sem cookies de rastreamento.</li>
        </ul>
      </section>

      <section>
        <h2>3. Para que usamos os dados</h2>
        <ul>
          <li>Permitir o seu acesso e o funcionamento do site (base legal: execução do serviço que você solicita).</li>
          <li>Encaminhar suas solicitações de adoção, lar temporário, voluntariado e perguntas à organização responsável, para que ela entre em contato com você.</li>
          <li>Avisar o tutor de um animal desaparecido quando alguém envia informações sobre ele.</li>
          <li>Enviar notificações no site e, se você mantiver a opção ativa, por e-mail.</li>
          <li>Gerar estatísticas para as organizações (sem identificar pessoas) e para a avaliação acadêmica do projeto.</li>
        </ul>
        <p>Não vendemos dados nem os usamos para publicidade.</p>
      </section>

      <section>
        <h2>4. Com quem os dados são compartilhados</h2>
        <ul>
          <li><strong>Organizações de proteção animal:</strong> recebem os dados das solicitações, inscrições e perguntas feitas a elas.</li>
          <li><strong>Tutores de animais desaparecidos:</strong> recebem o seu nome e a mensagem enviada sobre o animal deles, além do contato de retorno, se você o informar.</li>
          <li>
            <strong>Fornecedores de infraestrutura:</strong> Supabase (banco de dados, autenticação e armazenamento de fotos), Vercel
            (hospedagem e estatísticas de acesso) e, quando ativado, Brevo (envio de e-mails). Eles tratam os dados apenas para
            prestar esses serviços.
          </li>
        </ul>
        <p>
          Fotos e informações de animais cadastrados para adoção ou como desaparecidos são públicas, pois o objetivo é que sejam
          vistas pelo maior número de pessoas.
        </p>
      </section>

      <section>
        <h2>5. Por quanto tempo guardamos</h2>
        <p>
          Os dados ficam armazenados enquanto a sua conta existir. Ao excluir a conta, o seu perfil, as suas solicitações,
          inscrições, registros de animais desaparecidos e mensagens são apagados.
        </p>
      </section>

      <section>
        <h2>6. Seus direitos</h2>
        <p>Pela LGPD, você pode a qualquer momento:</p>
        <ul>
          <li>acessar e corrigir seus dados, em <Link to="/perfil">Meu perfil</Link>;</li>
          <li>desativar as notificações por e-mail, também em Meu perfil;</li>
          <li>excluir sua conta e seus dados, em <Link to="/configuracoes">Configurações da conta</Link>;</li>
          <li>pedir informações sobre o tratamento dos seus dados ou revogar o consentimento, pelo e-mail acima.</li>
        </ul>
      </section>

      <section>
        <h2>7. Segurança</h2>
        <p>
          O acesso ao banco de dados é controlado por regras de segurança que permitem a cada pessoa ver apenas os próprios
          dados e a cada organização apenas os dados relacionados a ela. A comunicação com o site é sempre criptografada (HTTPS).
        </p>
      </section>

      <section>
        <h2>8. Armazenamento no seu dispositivo</h2>
        <p>
          O site guarda no seu navegador apenas o necessário para funcionar: a sua sessão de login, preferências do painel e,
          como aplicativo instalável (PWA), cópias de páginas e fotos para abrir mais rápido. Não usamos cookies de publicidade.
        </p>
      </section>

      <section>
        <h2>9. Menores de idade</h2>
        <p>
          O cadastro é destinado a maiores de 18 anos. Adoções e lares temporários exigem que o responsável seja maior de idade.
        </p>
      </section>

      <section>
        <h2>10. Alterações</h2>
        <p>
          Esta política pode ser atualizada. A data da última atualização fica no topo da página. Consulte também os{' '}
          <Link to="/termos">Termos de Uso</Link>.
        </p>
      </section>
    </PaginaTexto>
  );
}
