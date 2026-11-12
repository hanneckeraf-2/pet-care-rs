import { Link } from 'react-router-dom';
import PaginaTexto from '../components/PaginaTexto';
import { CONTATO } from '../lib/constants';

export default function Termos() {
  return (
    <PaginaTexto titulo="Termos de Uso" atualizadoEm="11/11/2026">
      <section>
        <h2>1. O que é o Pet Care RS</h2>
        <p>
          O Pet Care RS é um site gratuito, acadêmico e sem fins lucrativos que reúne informações de organizações de proteção
          animal do Vale do Sinos/RS e ajuda a conectar essas organizações a adotantes, lares temporários, voluntários,
          doadores e tutores de animais desaparecidos. Ao usar o site, você concorda com estes termos e com a{' '}
          <Link to="/privacidade">Política de Privacidade</Link>.
        </p>
      </section>

      <section>
        <h2>2. Papel do site</h2>
        <ul>
          <li>
            O Pet Care RS <strong>não realiza adoções</strong>: cada organização é responsável pelos seus animais, pela análise das
            solicitações e pelas condições de adoção e de lar temporário.
          </li>
          <li>
            O site <strong>não intermedeia doações</strong>: as contribuições são feitas diretamente para as organizações, pela chave
            Pix informada por elas.
          </li>
          <li>
            As informações dos animais e das organizações são publicadas pelas próprias organizações e pelos tutores, que
            respondem pela sua veracidade.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Sua conta</h2>
        <ul>
          <li>O cadastro é destinado a maiores de 18 anos.</li>
          <li>Você é responsável pelas informações que fornece e por manter sua senha em segurança.</li>
          <li>Você pode excluir sua conta a qualquer momento em Configurações da conta.</li>
        </ul>
      </section>

      <section>
        <h2>4. Uso adequado</h2>
        <p>Não é permitido:</p>
        <ul>
          <li>publicar informações falsas, ofensivas ou de animais que não estejam realmente desaparecidos, encontrados ou disponíveis;</li>
          <li>usar o site para venda ou comércio de animais;</li>
          <li>usar os contatos obtidos no site para spam, golpes ou qualquer finalidade alheia ao bem-estar animal;</li>
          <li>tentar acessar dados de outras pessoas ou interferir no funcionamento do site.</li>
        </ul>
        <p>Conteúdos que violem estas regras podem ser removidos e as contas responsáveis, suspensas.</p>
      </section>

      <section>
        <h2>5. Limitação de responsabilidade</h2>
        <p>
          O Pet Care RS é oferecido como está, por um projeto voluntário. Fazemos o possível para manter o site disponível e
          seguro, mas não garantimos funcionamento ininterrupto e não nos responsabilizamos pelos acordos firmados entre
          usuários e organizações.
        </p>
      </section>

      <section>
        <h2>6. Contato</h2>
        <p>
          Dúvidas, denúncias de conteúdo indevido ou pedidos relacionados aos seus dados:{' '}
          <a href={`mailto:${CONTATO.email}`}>{CONTATO.email}</a> ou pela página <Link to="/contato">Contato</Link>.
        </p>
      </section>
    </PaginaTexto>
  );
}
