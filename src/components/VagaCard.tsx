import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, CalendarClock, HandHeart, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { traduzirErro } from '../lib/erros';
import { DISPONIBILIDADE, STATUS_INSCRICAO } from '../lib/labels';
import type { Vaga } from '../lib/organizacoes';
import { useAuth } from '../contexts/AuthContext';
import type { Enums } from '../types/database';
import Badge from './Badge';
import { Alert, Button, Field, Input, Textarea } from './ui';

type Props = {
  vaga: Vaga;
  statusInscricao?: Enums<'status_inscricao'>;
  onInscrito: () => void;
  /** esconde o nome da organização (usado na página da própria organização) */
  ocultarOrganizacao?: boolean;
};

export default function VagaCard({ vaga, statusInscricao, onInscrito, ocultarOrganizacao = false }: Props) {
  const { user, perfil, recarregarPerfil } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [telefone, setTelefone] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const inscricaoAtiva = statusInscricao === 'pendente' || statusInscricao === 'aprovada';
  const precisaTelefone = !perfil?.telefone;

  function abrir() {
    if (!user) return navigate('/entrar', { state: { from: location.pathname + location.search } });
    setAberto(true);
  }

  async function inscrever(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (precisaTelefone && !/^[\d\s()+-]{8,20}$/.test(telefone.trim())) {
      return setErro('Informe um telefone válido para a organização entrar em contato.');
    }
    setErro(null);
    setEnviando(true);
    if (precisaTelefone) {
      await supabase.from('usuario').update({ telefone: telefone.trim() }).eq('id', user.id);
      recarregarPerfil();
    }
    const { error } = await supabase.from('inscricao_voluntariado').insert({
      id_vaga: vaga.id,
      id_usuario: user.id,
      mensagem: mensagem.trim() || null,
    });
    setEnviando(false);
    if (error) {
      return setErro(error.code === '23505' ? 'Você já tem uma inscrição ativa nesta vaga.' : traduzirErro(error));
    }
    setAberto(false);
    onInscrito();
  }

  return (
    <article className="bg-white rounded-lg shadow-md p-5 flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h3 className="text-lg font-semibold">{vaga.titulo}</h3>
        <span className="text-xs font-semibold uppercase tracking-wide bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
          {vaga.atividade}
        </span>
      </div>

      <div className="text-sm text-gray-600 space-y-1 mb-3">
        {!ocultarOrganizacao && (
          <p className="flex items-center gap-2">
            <Building2 size={14} aria-hidden="true" />
            <Link to={`/organizacoes/${vaga.organizacao.id}`} className="hover:text-purple-700 font-medium">
              {vaga.organizacao.nome}
            </Link>
          </p>
        )}
        <p className="flex items-center gap-2"><MapPin size={14} aria-hidden="true" /> {vaga.organizacao.cidade}</p>
        <p className="flex items-center gap-2"><CalendarClock size={14} aria-hidden="true" /> {DISPONIBILIDADE[vaga.disponibilidade]}</p>
      </div>

      {vaga.descricao && <p className="text-gray-700 text-sm mb-4">{vaga.descricao}</p>}

      <div className="mt-auto">
        {inscricaoAtiva && statusInscricao ? (
          <p className="text-sm flex items-center gap-2">
            Sua inscrição: <Badge {...STATUS_INSCRICAO[statusInscricao]} />
          </p>
        ) : aberto ? (
          <form onSubmit={inscrever} className="space-y-3 border-t border-gray-100 pt-4" noValidate>
            {erro && <Alert type="error">{erro}</Alert>}
            {precisaTelefone && (
              <Field id={`tel-${vaga.id}`} label="Telefone / WhatsApp">
                <Input id={`tel-${vaga.id}`} type="tel" placeholder="(51) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              </Field>
            )}
            <Field id={`msg-${vaga.id}`} label="Conte um pouco sobre você (opcional)">
              <Textarea
                id={`msg-${vaga.id}`}
                rows={3}
                maxLength={1000}
                placeholder="Experiência, horários disponíveis, motivação..."
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" loading={enviando}>Enviar inscrição</Button>
              <Button type="button" variant="secondary" onClick={() => setAberto(false)}>Cancelar</Button>
            </div>
          </form>
        ) : (
          <>
            {statusInscricao && (
              <p className="text-xs text-gray-500 mb-2">
                Inscrição anterior: {STATUS_INSCRICAO[statusInscricao].label.toLowerCase()}
              </p>
            )}
            <Button onClick={abrir} className="w-full">
              <HandHeart size={18} aria-hidden="true" /> Quero Ajudar
            </Button>
          </>
        )}
      </div>
    </article>
  );
}
