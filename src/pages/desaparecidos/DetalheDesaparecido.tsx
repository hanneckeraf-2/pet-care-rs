import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { QueryData } from '@supabase/supabase-js';
import { ArrowLeft, Calendar, MapPin, MessageCircle, PartyPopper, PawPrint, Tag, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { ESPECIE_LABEL, PORTE_LABEL, SEXO_LABEL, STATUS_DESAPARECIDOS, formatarIdade } from '../../lib/animais';
import { STATUS_ANIMAL, formatarData } from '../../lib/labels';
import { removerArquivos } from '../../lib/upload';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Card, Field, Input, Textarea } from '../../components/ui';
import Badge from '../../components/Badge';
import BotaoCompartilhar from '../../components/BotaoCompartilhar';
import Spinner from '../../components/Spinner';
import NotFound from '../NotFound';

const detalheQuery = (id: number) =>
  supabase
    .from('animal')
    .select('*, organizacao(id, nome, telefone, email), foto(id, url, ordem, descricao, storage_path)')
    .eq('id', id)
    .order('ordem', { referencedTable: 'foto' })
    .maybeSingle();
type Registro = NonNullable<QueryData<ReturnType<typeof detalheQuery>>>;

type Mensagem = { id: number; mensagem: string; contato_retorno: string | null; nome_remetente: string; criado_em: string };

function formatarDataSimples(data: string) {
  const [a, m, d] = data.split('-');
  return `${d}/${m}/${a}`;
}

export default function DetalheDesaparecido() {
  const { id } = useParams();
  const animalId = Number(id);
  const { user, perfil } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const estado = location.state as { sucesso?: boolean; aviso?: string } | null;

  const [registro, setRegistro] = useState<Registro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);

  const [textoMsg, setTextoMsg] = useState('');
  const [contato, setContato] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [msgEnviada, setMsgEnviada] = useState(false);
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const carregar = useCallback(async () => {
    if (!Number.isInteger(animalId)) return setCarregando(false);
    const { data, error } = await detalheQuery(animalId);
    if (error) setErro(traduzirErro(error));
    setRegistro(data);
    setCarregando(false);
  }, [animalId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const responsavel =
    !!registro &&
    !!user &&
    (registro.id_usuario === user.id ||
      (registro.id_organizacao !== null &&
        (perfil?.tipo_usuario === 'admin_sistema' ||
          (perfil?.tipo_usuario === 'admin_org' && perfil.id_organizacao === registro.id_organizacao))));

  useEffect(() => {
    if (!responsavel) return;
    supabase
      .from('mensagem_animal')
      .select('id, mensagem, contato_retorno, nome_remetente, criado_em')
      .eq('id_animal', animalId)
      .order('criado_em', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao carregar mensagens', error);
          setErro(traduzirErro(error));
        }
        setMensagens(data ?? []);
      });
  }, [responsavel, animalId]);

  useEffect(() => {
    if (perfil && !contato) setContato(perfil.telefone || user?.email || '');
    // só preenche uma vez quando o perfil carrega
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perfil]);

  if (carregando) return <Spinner />;
  if (erro) return <div className="container mx-auto px-4 py-10"><Alert type="error">{erro}</Alert></div>;
  if (!registro) return <NotFound />;

  const ativo = (STATUS_DESAPARECIDOS as readonly string[]).includes(registro.status);
  if (!ativo && registro.status !== 'reunido') return <Navigate to={`/animais/${registro.id}`} replace />;

  const perdido = registro.status === 'perdido';
  const fotos = registro.foto;

  async function enviarMensagem(e: FormEvent) {
    e.preventDefault();
    if (!user || !registro) return;
    if (textoMsg.trim().length < 5) return setErroMsg('Escreva uma mensagem com pelo menos 5 caracteres.');
    setErroMsg(null);
    setEnviando(true);
    const { error } = await supabase.from('mensagem_animal').insert({
      id_animal: registro.id,
      id_remetente: user.id,
      mensagem: textoMsg.trim(),
      contato_retorno: contato.trim() || null,
    });
    setEnviando(false);
    if (error) return setErroMsg(traduzirErro(error));
    setMsgEnviada(true);
    setTextoMsg('');
  }

  async function marcarReunido() {
    if (!registro || !confirm(`Confirmar que ${registro.nome === 'Sem nome' ? 'o animal' : registro.nome} voltou para casa?`)) return;
    setProcessando(true);
    const { error } = await supabase.from('animal').update({ status: 'reunido' }).eq('id', registro.id);
    setProcessando(false);
    if (error) return setErro(traduzirErro(error));
    carregar();
  }

  async function excluir() {
    if (!registro || !confirm('Excluir este registro permanentemente?')) return;
    setProcessando(true);
    const caminhos = registro.foto.map((f) => f.storage_path);
    const { error } = await supabase.from('animal').delete().eq('id', registro.id);
    if (error) {
      setProcessando(false);
      return setErro(traduzirErro(error));
    }
    await removerArquivos(caminhos);
    navigate('/desaparecidos', { replace: true });
  }

  const dados = [
    { icon: PawPrint, label: 'Espécie', valor: ESPECIE_LABEL[registro.especie] + (registro.raca ? ` · ${registro.raca}` : '') },
    { icon: Tag, label: 'Sexo / porte', valor: `${SEXO_LABEL[registro.sexo]}${registro.porte ? ` · ${PORTE_LABEL[registro.porte]}` : ''}` },
    { icon: Calendar, label: perdido ? 'Desapareceu em' : 'Encontrado em', valor: registro.data_desaparecimento ? formatarDataSimples(registro.data_desaparecimento) : 'Não informado' },
    { icon: MapPin, label: perdido ? 'Último local visto' : 'Local', valor: [registro.ultimo_local_visto, registro.local, registro.cidade].filter(Boolean).join(' · ') },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <Link to="/desaparecidos" className="inline-flex items-center gap-1 text-purple-700 hover:underline mb-6">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar para desaparecidos
      </Link>

      <div className="space-y-3 mb-6">
        {estado?.sucesso && (
          <Alert type="success">
            Registro publicado! Compartilhe esta página nas redes sociais para aumentar o alcance. Você verá aqui as mensagens de quem tiver informações.
          </Alert>
        )}
        {estado?.aviso && <Alert type="error">{estado.aviso}</Alert>}
        {registro.status === 'reunido' && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-4">
            <PartyPopper aria-hidden="true" /> <strong>Final feliz!</strong> Este animal já voltou para casa.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden shadow-md">
            {fotos.length > 0 ? (
              <img src={fotos[fotoAtiva]?.url} alt={`Foto de ${registro.nome}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><PawPrint className="w-24 h-24" aria-hidden="true" /></div>
            )}
          </div>
          {fotos.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {fotos.map((f, i) => (
                <button
                  key={f.id}
                  onClick={() => setFotoAtiva(i)}
                  className={`w-20 h-20 shrink-0 rounded-md overflow-hidden border-2 ${i === fotoAtiva ? 'border-purple-600' : 'border-transparent'}`}
                  aria-label={`Ver foto ${i + 1}`}
                >
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-4xl font-bold">{registro.nome}</h1>
            <Badge {...STATUS_ANIMAL[registro.status]} />
          </div>
          <div className="mb-3">
            <BotaoCompartilhar
              titulo={`${registro.nome} | Pet Care RS`}
              texto={
                registro.status === 'perdido'
                  ? `Ajude a encontrar ${registro.nome}! Desapareceu em ${registro.cidade}. Viu este animal?`
                  : `Animal encontrado em ${registro.cidade}. Ajude a encontrar a família:`
              }
            />
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Registrado em {formatarData(registro.criado_em)}
            {registro.organizacao && <> por <Link className="text-purple-700 hover:underline" to={`/organizacoes/${registro.organizacao.id}`}>{registro.organizacao.nome}</Link></>}
            {registro.idade_meses !== null && <> · {formatarIdade(registro.idade_meses)}</>}
          </p>

          <dl className="space-y-4 mb-6">
            {dados.map(({ icon: Icon, label, valor }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                  <Icon className="text-orange-600" size={18} aria-hidden="true" />
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
                  <dd className="font-medium">{valor}</dd>
                </div>
              </div>
            ))}
          </dl>

          {registro.descricao && (
            <div className="mb-6">
              <h2 className="font-semibold text-lg mb-1">Descrição</h2>
              <p className="text-gray-700 whitespace-pre-line">{registro.descricao}</p>
            </div>
          )}

          {/* Responsável: ações de gestão */}
          {responsavel && (
            <Card className="!p-4 mb-6 border border-purple-100">
              <h2 className="font-semibold mb-3">Gerenciar registro</h2>
              <div className="flex flex-wrap gap-3">
                {ativo && (
                  <Button onClick={marcarReunido} loading={processando}>
                    <PartyPopper size={18} aria-hidden="true" /> {perdido ? 'Meu pet voltou para casa' : 'A família foi encontrada'}
                  </Button>
                )}
                <Button variant="secondary" onClick={excluir} disabled={processando} className="!text-red-600">
                  <Trash2 size={18} aria-hidden="true" /> Excluir registro
                </Button>
              </div>
            </Card>
          )}

          {/* Visitante: entrar em contato */}
          {!responsavel && ativo && (
            <Card className="!p-5">
              <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <MessageCircle size={20} className="text-purple-600" aria-hidden="true" /> {perdido ? 'Viu este animal?' : 'Conhece este animal?'}
              </h2>
              {!user ? (
                <>
                  <p className="text-gray-600 text-sm mb-3">Entre na sua conta para enviar informações a quem fez o registro.</p>
                  <Button onClick={() => navigate('/entrar', { state: { from: location.pathname } })}>Entrar em Contato</Button>
                </>
              ) : msgEnviada ? (
                <Alert type="success">Mensagem enviada! Quem fez o registro poderá entrar em contato com você.</Alert>
              ) : (
                <form onSubmit={enviarMensagem} className="space-y-3 mt-3" noValidate>
                  {erroMsg && <Alert type="error">{erroMsg}</Alert>}
                  <Field id="msg" label="Sua mensagem">
                    <Textarea
                      id="msg"
                      rows={3}
                      maxLength={2000}
                      placeholder="Ex.: Vi um gato parecido ontem à tarde na praça do bairro..."
                      value={textoMsg}
                      onChange={(e) => setTextoMsg(e.target.value)}
                    />
                  </Field>
                  <Field id="contato" label="Seu contato para retorno" hint="Telefone ou e-mail que será mostrado a quem fez o registro.">
                    <Input id="contato" maxLength={120} value={contato} onChange={(e) => setContato(e.target.value)} />
                  </Field>
                  <Button type="submit" loading={enviando}>Enviar mensagem</Button>
                </form>
              )}
            </Card>
          )}
        </div>
      </div>

      {responsavel && (
        <section className="max-w-3xl mt-12" aria-labelledby="titulo-mensagens">
          <h2 id="titulo-mensagens" className="text-2xl font-bold mb-4">Mensagens recebidas ({mensagens.length})</h2>
          {mensagens.length === 0 ? (
            <p className="text-gray-600">Nenhuma mensagem ainda. Compartilhe o link desta página para que mais pessoas vejam.</p>
          ) : (
            <ul className="space-y-3">
              {mensagens.map((m) => (
                <li key={m.id} className="bg-white rounded-lg shadow-sm p-4">
                  <div className="flex flex-wrap justify-between gap-2 text-sm mb-1">
                    <strong>{m.nome_remetente || 'Usuário'}</strong>
                    <span className="text-gray-500">{new Date(m.criado_em).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-line">{m.mensagem}</p>
                  {m.contato_retorno && <p className="text-sm text-purple-700 mt-2">Contato: {m.contato_retorno}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
