import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotificacoes, type Notificacao } from '../contexts/NotificacoesContext';
import { tempoRelativo } from '../lib/tempo';

export default function SinoNotificacoes() {
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoes();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => setAberto(false), [pathname]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  function abrirNotificacao(n: Notificacao) {
    if (!n.lida) marcarLida(n.id);
    setAberto(false);
    if (n.link) navigate(n.link);
  }

  const recentes = notificacoes.slice(0, 6);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto((v) => !v)}
        className="relative p-2 rounded-full text-gray-700 hover:bg-gray-100"
        aria-label={naoLidas > 0 ? `Notificações, ${naoLidas} não lidas` : 'Notificações'}
        aria-haspopup="true"
        aria-expanded={aberto}
      >
        <Bell className="w-6 h-6" aria-hidden="true" />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold">Notificações</span>
            {naoLidas > 0 && (
              <button onClick={marcarTodasLidas} className="text-xs text-purple-700 hover:underline">
                Marcar todas como lidas
              </button>
            )}
          </div>
          {recentes.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">Nenhuma notificação por enquanto.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {recentes.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => abrirNotificacao(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex gap-3 ${n.lida ? '' : 'bg-purple-50/60'}`}
                  >
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.lida ? 'bg-transparent' : 'bg-purple-600'}`} aria-hidden="true" />
                    <span>
                      <span className="block text-sm text-gray-800">{n.mensagem}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{tempoRelativo(n.criado_em)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link to="/notificacoes" className="block text-center text-sm font-semibold text-purple-700 py-2 border-t border-gray-100 hover:bg-gray-50">
            Ver todas
          </Link>
        </div>
      )}
    </div>
  );
}
