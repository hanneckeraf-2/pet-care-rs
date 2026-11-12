import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { Alert } from '../../components/ui';
import Spinner from '../../components/Spinner';
import { useAdmin } from './AdminLayout';

type Mensagem = {
  id: number;
  mensagem: string;
  contato_retorno: string | null;
  nome_remetente: string;
  criado_em: string;
  animal: { id: number; nome: string; status: string };
};

/** Gera links de resposta a partir do contato informado (e-mail e/ou telefone). */
function linksResposta(contato: string | null, animal: string) {
  if (!contato) return [];
  const links: { href: string; label: string; icon: typeof Mail }[] = [];
  const email = contato.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)?.[0];
  if (email) {
    links.push({ href: `mailto:${email}?subject=${encodeURIComponent(`Sobre ${animal} - Pet Care RS`)}`, label: 'Responder por e-mail', icon: Mail });
  }
  let digitos = contato.replace(/\D/g, '');
  if (!email && digitos.length >= 10 && digitos.length <= 13) {
    if (digitos.length <= 11) digitos = `55${digitos}`;
    links.push({ href: `https://wa.me/${digitos}`, label: 'Responder no WhatsApp', icon: MessageCircle });
  }
  return links;
}

/** Perguntas recebidas ("Quero Mais Informações") sobre os animais da organização. */
export default function AdminMensagens() {
  const { org } = useAdmin();
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const { data, error } = await supabase
      .from('mensagem_animal')
      .select('id, mensagem, contato_retorno, nome_remetente, criado_em, animal!inner(id, nome, status, id_organizacao)')
      .eq('animal.id_organizacao', org.id)
      .order('criado_em', { ascending: false });
    if (error) setErro(traduzirErro(error));
    setMensagens((data as Mensagem[] | null) ?? []);
    setCarregando(false);
  }, [org.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function apagar(id: number) {
    if (!confirm('Apagar esta mensagem?')) return;
    const { error } = await supabase.from('mensagem_animal').delete().eq('id', id);
    if (error) return setErro(traduzirErro(error));
    setMensagens((l) => l.filter((m) => m.id !== id));
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">Mensagens</h2>
      <p className="text-sm text-gray-600 mb-4">
        Perguntas enviadas pelo botão "Quero Mais Informações" e informações sobre animais resgatados. Responda pelo contato que a pessoa informou.
      </p>

      {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}

      {carregando ? (
        <Spinner />
      ) : mensagens.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-600">Nenhuma mensagem recebida ainda.</div>
      ) : (
        <ul className="space-y-3">
          {mensagens.map((m) => {
            const linkAnimal = ['disponivel', 'em_processo', 'em_lar_temporario', 'adotado'].includes(m.animal.status)
              ? `/animais/${m.animal.id}`
              : `/desaparecidos/${m.animal.id}`;
            return (
              <li key={m.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <p className="text-sm">
                    <strong>{m.nome_remetente || 'Usuário'}</strong> <span className="text-gray-500">sobre</span>{' '}
                    <Link to={linkAnimal} className="font-semibold text-purple-700 hover:underline">{m.animal.nome}</Link>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{new Date(m.criado_em).toLocaleString('pt-BR')}</span>
                    <button onClick={() => apagar(m.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" aria-label="Apagar mensagem">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-800 whitespace-pre-line mb-3">{m.mensagem}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {m.contato_retorno && <span className="text-gray-600">Contato: {m.contato_retorno}</span>}
                  {linksResposta(m.contato_retorno, m.animal.nome).map(({ href, label, icon: Icon }) => (
                    <a
                      key={href}
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-purple-600 text-white px-3 py-1.5 rounded-md hover:bg-purple-700 font-semibold"
                    >
                      <Icon size={14} aria-hidden="true" /> {label}
                    </a>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
