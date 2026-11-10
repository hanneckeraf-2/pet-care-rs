import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { QueryData } from '@supabase/supabase-js';
import { ArrowLeft, Building2, Calendar, CheckCircle2, Heart, Mail, MapPin, PawPrint, Phone, Ruler, Tag } from 'lucide-react';
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
import type { Enums } from '../../types/database';

const detalheQuery = (id: number) =>
  supabase
    .from('animal')
    .select('*, organizacao(id, nome, cidade, telefone, email), foto(id, url, ordem, descricao)')
    .eq('id', id)
    .order('ordem', { referencedTable: 'foto' })
    .maybeSingle();
type AnimalDetalhe = NonNullable<QueryData<ReturnType<typeof detalheQuery>>>;

type MinhaSolicitacao = { id: number; status: Enums<'status_adocao'>; criado_em: string } | null;

export default function DetalheAnimal() {
  const { id } = useParams();
  const animalId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [animal, setAnimal] = useState<AnimalDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [solicitacao, setSolicitacao] = useState<MinhaSolicitacao>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviado, setEnviado] = useState(false);

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
    if (!user || !Number.isInteger(animalId)) return setSolicitacao(null);
    const { data } = await supabase
      .from('adocao')
      .select('id, status, criado_em')
      .eq('id_animal', animalId)
      .eq('id_usuario', user.id)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSolicitacao(data);
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
  const solicitacaoAberta = solicitacao?.status === 'em_analise';

  function clicarSolicitar() {
    if (!user) {
      navigate('/entrar', { state: { from: location.pathname } });
      return;
    }
    setMostrarForm(true);
    setTimeout(() => document.getElementById('form-adocao')?.scrollIntoView({ behavior: 'smooth' }), 50);
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

          {/* Ação de adoção */}
          {enviado ? (
            <Alert type="success">
              <strong>Solicitação enviada!</strong> Sua solicitação está em análise pela {animal.organizacao?.nome}. Você pode acompanhar o andamento em{' '}
              <Link to="/perfil" className="underline font-semibold">Meu perfil</Link>.
            </Alert>
          ) : solicitacaoAberta ? (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
              <CheckCircle2 className="text-yellow-700" size={18} aria-hidden="true" />
              Você já solicitou a adoção em {formatarData(solicitacao.criado_em)}: <Badge {...STATUS_ADOCAO[solicitacao.status]} />
            </div>
          ) : disponivelParaAdocao ? (
            !mostrarForm && (
              <Button onClick={clicarSolicitar} className="w-full sm:w-auto !px-8 !py-3 text-lg">
                <Heart size={20} aria-hidden="true" /> Solicitar Adoção
              </Button>
            )
          ) : animal.organizacao ? (
            <p className="text-gray-600">Este animal não está mais disponível para adoção.</p>
          ) : (
            <p className="text-gray-600">
              Este é um registro de animal desaparecido.{' '}
              <Link to="/desaparecidos" className="text-purple-700 font-semibold hover:underline">Ver animais desaparecidos</Link>
            </p>
          )}
          {solicitacao && !solicitacaoAberta && !enviado && disponivelParaAdocao && (
            <p className="text-sm text-gray-500 mt-2">
              Sua solicitação anterior: <Badge {...STATUS_ADOCAO[solicitacao.status]} />
            </p>
          )}
        </div>
      </div>

      {mostrarForm && !enviado && (
        <div id="form-adocao" className="max-w-3xl mx-auto mt-12">
          <Card>
            <SolicitarAdocao
              animalId={animal.id}
              animalNome={animal.nome}
              onCancelar={() => setMostrarForm(false)}
              onEnviado={() => {
                setEnviado(true);
                setMostrarForm(false);
                carregarSolicitacao();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
