import { Link, useNavigate } from 'react-router-dom';
import { Bell, BellRing, Trash2 } from 'lucide-react';
import { useNotificacoes, type Notificacao } from '../../contexts/NotificacoesContext';
import { useAuth } from '../../contexts/AuthContext';
import { tempoRelativo } from '../../lib/tempo';
import Spinner from '../../components/Spinner';

export default function Notificacoes() {
  const { notificacoes, naoLidas, carregando, marcarLida, marcarTodasLidas, remover } = useNotificacoes();
  const { perfil } = useAuth();
  const navigate = useNavigate();

  function abrir(n: Notificacao) {
    if (!n.lida) marcarLida(n.id);
    if (n.link) navigate(n.link);
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="text-purple-600" aria-hidden="true" /> Notificações
        </h1>
        {naoLidas > 0 && (
          <button onClick={marcarTodasLidas} className="text-sm text-purple-700 font-semibold hover:underline">
            Marcar todas como lidas
          </button>
        )}
      </div>

      {!perfil?.alertas_ativos && (
        <div className="flex items-start gap-3 bg-purple-50 border border-purple-100 rounded-lg p-4 mb-6 text-sm">
          <BellRing className="text-purple-600 shrink-0" size={20} aria-hidden="true" />
          <p>
            Quer saber quando surgir um animal para adoção ou desaparecido na sua cidade?{' '}
            <Link to="/perfil" className="text-purple-700 font-semibold hover:underline">Ative os alertas no seu perfil</Link>.
          </p>
        </div>
      )}

      {carregando ? (
        <Spinner />
      ) : notificacoes.length === 0 ? (
        <p className="text-center text-gray-600 py-16 bg-white rounded-lg shadow-sm">Você não tem notificações.</p>
      ) : (
        <ul className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
          {notificacoes.map((n) => (
            <li key={n.id} className={`flex items-start gap-3 p-4 ${n.lida ? '' : 'bg-purple-50/60'}`}>
              <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${n.lida ? 'bg-gray-200' : 'bg-purple-600'}`} aria-hidden="true" />
              <button onClick={() => abrir(n)} className="flex-1 text-left">
                <span className={`block ${n.lida ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>{n.mensagem}</span>
                <span className="block text-xs text-gray-500 mt-1">{tempoRelativo(n.criado_em)}</span>
              </button>
              <button onClick={() => remover(n.id)} className="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600" aria-label="Apagar notificação">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
