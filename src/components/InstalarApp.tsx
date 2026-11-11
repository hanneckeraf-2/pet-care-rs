import { useState, useSyncExternalStore } from 'react';
import { Download, Share, X } from 'lucide-react';
import { assinarInstalacao, ehIOS, instalar, podeInstalar, rodandoInstalado } from '../lib/instalacao';

type Props = { className?: string };

/**
 * Botão "Instalar app". No Android/Chrome abre o diálogo nativo de instalação;
 * no iPhone mostra como adicionar à tela de início. Some se o app já estiver instalado.
 */
export default function InstalarApp({ className = '' }: Props) {
  const disponivel = useSyncExternalStore(assinarInstalacao, podeInstalar, () => false);
  const [ajudaIOS, setAjudaIOS] = useState(false);
  const ios = ehIOS();

  if (rodandoInstalado() || (!disponivel && !ios)) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (disponivel ? instalar() : setAjudaIOS((v) => !v))}
        className={`inline-flex items-center gap-2 text-sm font-semibold ${className}`}
        aria-expanded={ios ? ajudaIOS : undefined}
      >
        <Download size={16} aria-hidden="true" /> Instalar app
      </button>
      {ajudaIOS && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-white text-gray-800 rounded-lg shadow-lg p-4 text-sm z-50" role="dialog" aria-label="Como instalar no iPhone">
          <button onClick={() => setAjudaIOS(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" aria-label="Fechar">
            <X size={16} />
          </button>
          <p className="font-semibold mb-1">Instalar no iPhone</p>
          <p>
            No Safari, toque em <Share size={14} className="inline -mt-0.5" aria-label="Compartilhar" /> <strong>Compartilhar</strong> e depois em{' '}
            <strong>Adicionar à Tela de Início</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
