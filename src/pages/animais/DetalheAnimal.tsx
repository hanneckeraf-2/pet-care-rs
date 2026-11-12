import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { QueryData } from '@supabase/supabase-js';
import { ArrowLeft, Building2, Calendar, CheckCircle2, Heart, Home, Mail, MapPin, MessageCircle, PawPrint, Pencil, Phone, Ruler, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { ESPECIE_LABEL, PORTE_LABEL, SEXO_LABEL, formatarIdade } from '../../lib/animais';
import { STATUS_ADOCAO, STATUS_ANIMAL, formatarData } from '../../lib/labels';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Card } from '../../components/ui';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import NotFound from '../NotFound';
import SolicitarAdocao from './SolicitarAdocao';
import PerguntaAnimal from './PerguntaAnimal';
import type { Enums } from '../../types/database';

const detalheQuery = (id: number) =>
  supabase
    .from('animal')
    .select('*, organizacao(id, nome, cidade, telefone, email), foto(id, url, ordem, descricao)')
    .eq('id', id)
    .order('ordem', { referencedTable: 'foto' })
    .maybeSingle();
type AnimalDetalhe = NonNullable<QueryData<ReturnType<typeof detalheQuery>>>;

type MinhaSolicitacao = { id: number; status: Enums<'status_adocao'>; criado_em: string; tipo: Enums<'tipo_solicitacao'> };
type Acao = Enums<'tipo_solicitacao'> | 'pergunta';

export default function DetalheAnimal() {
  const { id } = useParams();
  const animalId = Number(id);
  const { user, perfil } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [animal, setAnimal] = useState<AnimalDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  // última solicitação do usuário para este animal, por tipo (adoção / lar temporário)
  const [solicitacoes, setSolicitacoes] = useState<Partial<Record<Enums<'tipo_solicitacao'>, MinhaSolicitacao>>>({});
  const [formAberto, setFormAberto] = useState<Acao | null>(null);
  const [enviado, setEnviado] = useState<Acao | null>(null);

  useEffect(() => {
    if (!Number.isInteger(animalId)) {
      setCarregando(false);
      return;
    }
    detalheQuery(animalId).then(({ data, error }) => {
      if (error) setErro(traduzirErro(error));
      setAnimal(data);
      setCarregando(false);
    });
  }, [animalId]);

  const carregarSolicitacao = useCallback(async () => {
    if (!user || !Number.isInteger(animalId)) return setSolicitacoes({});
    const { data } = await supabase
      .from('adocao')
      .select('id, status, criado_em, tipo')
      .eq('id_animal', animalId)
      .eq('id_usuario', user.id)
      .order('criado_em', { ascending: true });
    // em ordem crescente, a mais recente de cada tipo sobrescreve as anteriores
    const porTipo: Partial<Record<Enums<'tipo_solicitacao'>, MinhaSolicitacao>> = {};
    (data ?? []).forEach((item) => (porTipo[item.tipo] = item));
    setSolicitacoes(porTipo);
  }, [user, animalId]);

  useEffect(() => {
    carregarSolicitacao();
  }, [carregarSolicitacao]);

  if (carregando) return <Spinner />;
  if (erro) return <div className="container mx-auto px-4 py-10"><Alert type="error">{erro}</Alert></div>;
  if (!animal) return <NotFound />;
  // registros de desaparecidos têm página própria
  if (['perdido', 'encontrado', 'resgatado', 'reunido'].includes(animal.status)) {
    return <Navigate to={`/desaparecidos/${animal.id}`} replace />;
  }

  const fotos = animal.foto;
  const disponivelParaAdocao = !!animal.organizacao && (animal.status === 'disponivel' || animal.status === 'em_processo');
  const aceitaLarTemporario = disponivelParaAdocao && animal.aceita_lar_temporario;
  const gerencia =
    animal.id_organizacao !== null &&
    (perfil?.tipo_usuario === 'admin_sistema' ||
      (perfil?.tipo_usuario === 'admin_org' && perfil.id_organizacao === animal.id_organizacao));

  function abrir(acao: Acao) {
    if (!user) {
      navigate('/entrar', { state: { from: location.pathname } });
      return;
    }
    setEnviado(null);
    setFormAberto(acao);
    setTimeout(() => document.getElementById('form-acao')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  function aoEnviar(acao: Acao) {
    setEnviado(acao);
    setFormAberto(null);
    carregarSolicitacao();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const textoEnviado: Record<Acao, string> = {
    adocao: 'Solicitação de adoção enviada! Ela está em análise pela organização.',
    lar_temporario: 'Pedido de lar temporário enviado! A organização vai analisar e entrar em contato.',
    pergunta: 'Pergunta enviada! A organização vai responder pelo contato que você informou.',
  };

  /** Botão de uma ação, ou a situação da solicitação já feita. */
  function acaoSolicitacao(tipo: Enums<'tipo_solicitacao'>, rotulo: string, icone: ReactNode, classe: string) {
    const atual = solicitacoes[tipo];
    if (atual?.status === 'em_analise') {
      return (
        <div className="flex flex-wrap items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
          <CheckCircle2 className="text-yellow-700" size={18} aria-hidden="true" />
          {tipo === 'adocao' ? 'Você solicitou a adoção' : 'Você pediu para ser lar temporário'} em {formatarData(atual.criado_em)}:
          <Badge {...STATUS_ADOCAO[atual.status]} />
        </div>
      );
    }
    return (
      <div>
        <Button onClick={() => abrir(tipo)} className={`w-full sm:w-auto !px-6 !py-3 ${classe}`}>
          {icone} {rotulo}
        </Button>
        {atual && (
          <p className="text-xs text-gray-500 mt-1">
            Pedido anterior: <Badge {...STATUS_ADOCAO[atual.status]} />
          </p>
        )}
      </div>
    );
  }

  const caracteristicas = [
    { icon: PawPrint, label: 'Espécie', valor: ESPECIE_LABEL[animal.especie] + (animal.raca ? ` · ${animal.raca}` : '') },
    { icon: Calendar, label: 'Idade', valor: formatarIdade(animal.idade_meses) },
    { icon: Tag, label: 'Sexo', valor: SEXO_LABEL[animal.sexo] },
    { icon: Ruler, label: 'Porte', valor: animal.porte ? PORTE_LABEL[animal.porte] : 'Não informado' },
    { icon: MapPin, label: 'Localização', valor: [animal.local, animal.cidade].filter(Boolean).join(', ') },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/animais" className="inline-flex items-center gap-1 text-purple-700 hover:underline mb-6">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar para a busca
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Galeria */}
        <div>
          <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden shadow-md">
            {fotos.length > 0 ? (
              <img src={fotos[fotoAtiva]?.url} alt={fotos[fotoAtiva]?.descricao ?? `Foto de ${animal.nome}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <PawPrint className="w-24 h-24" aria-hidden="true" />
              </div>
            )}
          </div>
          {fotos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto" role="tablist" aria-label="Fotos">
              {fotos.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setFotoAtiva(i)}
                  className={`w-20 h-20 shrink-0 rounded-md overflow-hidden border-2 ${i === fotoAtiva ? 'border-purple-600' : 'border-transparent'}`}
                  aria-label={`Ver foto ${i + 1}`}
                  aria-selected={i === fotoAtiva}
                  role="tab"
                >
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold">{animal.nome}</h1>
            <Badge {...STATUS_ANIMAL[animal.status]} />
          </div>
          <p className="text-gray-500 text-sm mb-6">Cadastrado em {formatarData(animal.criado_em)}</p>
          {gerencia && (
            <Link
              to={`/admin/animais/${animal.id}/editar?org=${animal.id_organizacao}`}
              className="inline-flex items-center gap-2 mb-6 border border-purple-300 text-purple-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-purple-50"
            >
              <Pencil size={16} aria-hidden="true" /> Editar este animal
            </Link>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {caracteristicas.map(({ icon: Icon, label, valor }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <Icon className="text-purple-600" size={18} aria-hidden="true" />
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
                  <dd className="font-medium">{valor}</dd>
                </div>
              </div>
            ))}
          </dl>

          {animal.descricao && (
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-1">Sobre {animal.nome}</h2>
              <p className="text-gray-700 whitespace-pre-line">{animal.descricao}</p>
            </div>
          )}

          {animal.organizacao && (
            <Card className="mb-6 !p-4">
              <h2 className="text-sm text-gray-500 uppercase tracking-wide mb-2">Organização responsável</h2>
              <Link to={`/organizacoes/${animal.organizacao.id}`} className="flex items-center gap-2 font-semibold text-lg hover:text-purple-700">
                <Building2 size={20} className="text-purple-600" aria-hidden="true" />
                {animal.organizacao.nome}
              </Link>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {animal.organizacao.telefone && <p className="flex items-center gap-2"><Phone size={14} aria-hidden="true" /> {animal.organizacao.telefone}</p>}
                {animal.organizacao.email && <p className="flex items-center gap-2"><Mail size={14} aria-hidden="true" /> {animal.organizacao.email}</p>}
              </div>
            </Card>
          )}

          {/* Ações: adoção, lar temporário e perguntas */}
          {enviado && (
            <div className="mb-4">
              <Alert type="success">
                {textoEnviado[enviado]}{' '}
                {enviado !== 'pergunta' && (
                  <>Acompanhe em <Link to="/perfil" className="underline font-semibold">Meu perfil</Link>.</>
                )}
              </Alert>
            </div>
          )}

          {aceitaLarTemporario && (
            <div className="flex gap-3 bg-teal-50 border border-teal-200 text-teal-900 rounded-lg p-4 mb-4 text-sm">
              <Home className="shrink-0 text-teal-700" size={20} aria-hidden="true" />
              <p>
                <strong>{animal.nome} precisa de um lar temporário.</strong> Se você não pode adotar agora, pode acolhê-lo por um
                período enquanto ele espera uma família definitiva.
              </p>
            </div>
          )}

          {disponivelParaAdocao ? (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
              {acaoSolicitacao('adocao', 'Solicitar Adoção', <Heart size={20} aria-hidden="true" />, 'text-lg')}
              {aceitaLarTemporario &&
                acaoSolicitacao('lar_temporario', 'Quero ser Lar Temporário', <Home size={20} aria-hidden="true" />, '!bg-teal-600 hover:!bg-teal-700')}
              <div>
                <Button variant="secondary" onClick={() => abrir('pergunta')} className="w-full sm:w-auto !px-6 !py-3">
                  <MessageCircle size={20} aria-hidden="true" /> Quero Mais Informações
                </Button>
              </div>
            </div>
          ) : animal.organizacao ? (
            <p className="text-gray-600">Este animal não está mais disponível para adoção.</p>
          ) : (
            <p className="text-gray-600">
              Este é um registro de animal desaparecido.{' '}
              <Link to="/desaparecidos" className="text-purple-700 font-semibold hover:underline">Ver animais desaparecidos</Link>
            </p>
          )}
        </div>
      </div>

      {formAberto && (
        <div id="form-acao" className="max-w-3xl mx-auto mt-12">
          <Card>
            {formAberto === 'pergunta' ? (
              <PerguntaAnimal
                animalId={animal.id}
                animalNome={animal.nome}
                organizacaoNome={animal.organizacao?.nome}
                onCancelar={() => setFormAberto(null)}
                onEnviado={() => aoEnviar('pergunta')}
              />
            ) : (
              <SolicitarAdocao
                key={formAberto}
                tipo={formAberto}
                animalId={animal.id}
                animalNome={animal.nome}
                onCancelar={() => setFormAberto(null)}
                onEnviado={() => aoEnviar(formAberto)}
              />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
