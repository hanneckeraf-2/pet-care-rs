import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function assinar(fn: () => void) {
  window.addEventListener('online', fn);
  window.addEventListener('offline', fn);
  return () => {
    window.removeEventListener('online', fn);
    window.removeEventListener('offline', fn);
  };
}

/** Faixa exibida quando o dispositivo perde a conexão. */
export default function AvisoOffline() {
  const online = useSyncExternalStore(assinar, () => navigator.onLine, () => true);
  if (online) return null;

  return (
    <div className="bg-amber-100 text-amber-900 text-sm px-4 py-2 flex items-center justify-center gap-2" role="status">
      <WifiOff size={16} aria-hidden="true" />
      Você está sem internet. Algumas informações podem estar desatualizadas e não é possível enviar formulários.
    </div>
  );
}
