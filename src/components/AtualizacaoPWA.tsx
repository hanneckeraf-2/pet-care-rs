import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Avisa quando uma nova versão do site foi publicada e permite atualizar na hora. */
export default function AtualizacaoPWA() {
  const {
    needRefresh: [precisaAtualizar, setPrecisaAtualizar],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      // verifica novas versões a cada hora enquanto o site estiver aberto
      if (registro) setInterval(() => registro.update(), 60 * 60 * 1000);
    },
  });

  if (!precisaAtualizar) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:w-96 z-50 bg-gray-900 text-white rounded-lg shadow-xl p-4 flex items-center gap-3"
      role="status"
    >
      <RefreshCw className="text-purple-300 shrink-0" size={20} aria-hidden="true" />
      <p className="text-sm flex-1">Uma nova versão do Pet Care RS está disponível.</p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-3 py-1.5 rounded-md"
      >
        Atualizar
      </button>
      <button onClick={() => setPrecisaAtualizar(false)} className="text-gray-400 hover:text-white" aria-label="Dispensar">
        <X size={18} />
      </button>
    </div>
  );
}
