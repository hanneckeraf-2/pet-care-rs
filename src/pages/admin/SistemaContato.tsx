import { useEffect, useState } from 'react';
import { Inbox, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { useAuth } from '../../contexts/AuthContext';
import type { Tables } from '../../types/database';
import { Alert } from '../../components/ui';
import Spinner from '../../components/Spinner';

export function AcessoSistema() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-10 text-center">
      <ShieldCheck className="w-10 h-10 text-purple-400 mx-auto mb-3" aria-hidden="true" />
      <p className="text-gray-700 font-semibold">Área exclusiva do administrador do sistema.</p>
    </div>
  );
}

/** Mensagens enviadas pelo formulário da página Contato. */
export default function SistemaContato() {
  const { perfil } = useAuth();
  const sistema = perfil?.tipo_usuario === 'admin_sistema';
  const [mensagens, setMensagens] = useState<Tables<'mensagem_contato'>[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!sistema) return;
    supabase
      .from('mensagem_contato')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (error) setErro(traduzirErro(error));
        setMensagens(data ?? []);
        setCarregando(false);
      });
  }, [sistema]);

  if (!sistema) return <AcessoSistema />;
  if (carregando) return <Spinner />;

  return (
    <div>
      <h2 className="text-xl font-semibold flex items-center gap-2 mb-1">
        <Inbox className="text-purple-600" size={22} aria-hidden="true" /> Mensagens do site
      </h2>
      <p className="text-sm text-gray-600 mb-4">Enviadas pelo formulário da página Contato. Responda pelo e-mail de cada pessoa.</p>

      {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}

      {mensagens.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-600">Nenhuma mensagem recebida.</div>
      ) : (
        <ul className="space-y-3">
          {mensagens.map((m) => (
            <li key={m.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                <p className="font-semibold">{m.assunto}</p>
                <span className="text-xs text-gray-500">{new Date(m.criado_em).toLocaleString('pt-BR')}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {m.nome} · {m.email}
              </p>
              <p className="text-gray-800 whitespace-pre-line mb-3">{m.mensagem}</p>
              <a
                href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.assunto} - Pet Care RS`)}`}
                className="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 text-sm font-semibold"
              >
                <Mail size={14} aria-hidden="true" /> Responder por e-mail
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
