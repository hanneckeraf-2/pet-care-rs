import { useState } from 'react';
import { Check, ClipboardList, Copy, ExternalLink, Instagram, MessageCircle } from 'lucide-react';
import { Button } from '../../components/ui';

export type CanalExterno = 'formulario' | 'whatsapp' | 'instagram';

type Props = {
  canal: CanalExterno;
  href: string;
  rotuloBotao: string;
  /** mensagem sugerida; se o link já a preenche, não mostra o "copiar" */
  mensagem: string;
  mensagemPronta: boolean;
  acao: 'adotar' | 'informacoes';
  animalNome: string;
  organizacaoNome?: string;
  onVoltar: () => void;
};

const NOME_CANAL: Record<CanalExterno, string> = {
  formulario: 'formulário próprio',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
};

const ICONE = { formulario: ClipboardList, whatsapp: MessageCircle, instagram: Instagram };
const COR_BOTAO: Record<CanalExterno, string> = {
  formulario: 'bg-purple-600 hover:bg-purple-700',
  whatsapp: 'bg-green-600 hover:bg-green-700',
  instagram: 'bg-pink-600 hover:bg-pink-700',
};

/** Encaminha o interessado para o canal externo da organização (formulário, WhatsApp ou Instagram). */
export default function ContatoExterno({
  canal,
  href,
  rotuloBotao,
  mensagem,
  mensagemPronta,
  acao,
  animalNome,
  organizacaoNome,
  onVoltar,
}: Props) {
  const [copiado, setCopiado] = useState(false);
  const Icone = ICONE[canal];
  const org = organizacaoNome ?? 'A organização';

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="text-center py-4">
      <Icone className="w-12 h-12 text-purple-600 mx-auto mb-4" aria-hidden="true" />
      <h2 className="text-xl font-semibold mb-2">
        {acao === 'adotar' ? `Quero adotar ${animalNome}` : `Quero mais informações sobre ${animalNome}`}
      </h2>
      <p className="text-gray-700 max-w-xl mx-auto mb-6">
        {canal === 'formulario' ? (
          <>
            A <strong>{org}</strong> faz a adoção pelo próprio formulário. Clique no botão abaixo para preenchê-lo e informe que
            tem interesse em <strong>{animalNome}</strong>.
          </>
        ) : (
          <>
            A <strong>{org}</strong> atende os interessados pelo <strong>{NOME_CANAL[canal]}</strong>.{' '}
            {mensagemPronta
              ? 'O botão abaixo abre a conversa com uma mensagem pronta. É só revisar e enviar.'
              : 'Copie a mensagem sugerida, abra a conversa pelo botão abaixo e cole a mensagem.'}
          </>
        )}
      </p>

      {canal !== 'formulario' && !mensagemPronta && (
        <div className="max-w-xl mx-auto mb-6 text-left">
          <p className="text-sm font-medium text-gray-700 mb-1">Mensagem sugerida</p>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">{mensagem}</div>
          <button type="button" onClick={copiar} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-purple-700 hover:underline">
            {copiado ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copiado ? 'Mensagem copiada!' : 'Copiar mensagem'}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-md font-semibold transition ${COR_BOTAO[canal]}`}
        >
          <ExternalLink size={18} aria-hidden="true" /> {rotuloBotao}
        </a>
        <Button variant="secondary" onClick={onVoltar}>Voltar</Button>
      </div>
      <p className="text-xs text-gray-500 mt-4">
        {canal === 'formulario' ? 'O formulário abre em uma nova aba, no site da organização.' : `O ${NOME_CANAL[canal]} abre em uma nova aba ou no aplicativo.`}
      </p>
    </div>
  );
}
