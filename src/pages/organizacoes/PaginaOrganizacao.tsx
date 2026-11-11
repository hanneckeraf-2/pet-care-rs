import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Check, Copy, Facebook, Globe, HandCoins, Instagram, Mail, MapPin, MessageCircle, Phone, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { ANIMAL_CARD_SELECT, type AnimalCard } from '../../lib/animais';
import { VAGA_SELECT, lerContatos, type Vaga } from '../../lib/organizacoes';
import { useMinhasInscricoes } from '../../hooks/useMinhasInscricoes';
import type { Tables } from '../../types/database';
import { Alert, Card } from '../../components/ui';
import PetCard from '../../components/PetCard';
import VagaCard from '../../components/VagaCard';
import Spinner from '../../components/Spinner';
import NotFound from '../NotFound';

export default function PaginaOrganizacao() {
  const { id } = useParams();
  const orgId = Number(id);
  const [org, setOrg] = useState<Tables<'organizacao'> | null>(null);
  const [animais, setAnimais] = useState<AnimalCard[]>([]);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const { inscricoes, recarregar } = useMinhasInscricoes();

  useEffect(() => {
    if (!Number.isInteger(orgId)) return setCarregando(false);
    Promise.all([
      supabase.from('organizacao').select('*').eq('id', orgId).maybeSingle(),
      supabase
        .from('animal')
        .select(ANIMAL_CARD_SELECT)
        .eq('id_organizacao', orgId)
        .in('status', ['disponivel', 'em_processo', 'resgatado'])
        .order('criado_em', { ascending: false }),
      supabase
        .from('vaga_voluntariado')
        .select(VAGA_SELECT)
        .eq('id_organizacao', orgId)
        .eq('status', 'aberta')
        .order('criado_em', { ascending: false }),
    ]).then(([o, a, v]) => {
      const falha = o.error ?? a.error ?? v.error;
      if (falha) setErro(traduzirErro(falha));
      setOrg(o.data);
      setAnimais(a.data ?? []);
      setVagas(v.data ?? []);
      setCarregando(false);
    });
  }, [orgId]);

  if (carregando) return <Spinner />;
  if (erro && !org) return <div className="container mx-auto px-4 py-10"><Alert type="error">{erro}</Alert></div>;
  if (!org) return <NotFound />;

  const contatos = lerContatos(org.contatos);
  const paraAdocao = animais.filter((a) => a.status !== 'resgatado');
  const resgatados = animais.filter((a) => a.status === 'resgatado');

  async function copiarPix() {
    if (!org?.pix_doacao) return;
    try {
      await navigator.clipboard.writeText(org.pix_doacao);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  const linksContato = [
    org.telefone && { href: `tel:${org.telefone.replace(/[^\d+]/g, '')}`, label: org.telefone, icon: Phone },
    org.email && { href: `mailto:${org.email}`, label: org.email, icon: Mail },
    contatos.whatsapp && { href: `https://wa.me/${contatos.whatsapp}`, label: 'WhatsApp', icon: MessageCircle },
    contatos.whatsappGrupo && { href: contatos.whatsappGrupo, label: 'Grupo no WhatsApp', icon: Users },
    contatos.instagram && { href: contatos.instagram, label: 'Instagram', icon: Instagram },
    contatos.facebook && { href: contatos.facebook, label: 'Facebook', icon: Facebook },
    contatos.site && { href: contatos.site, label: 'Site', icon: Globe },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Phone }[];

  return (
    <div>
      {/* Cabeçalho */}
      <div className="relative h-56 md:h-72 bg-purple-100">
        {org.foto_url && <img src={org.foto_url} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0">
          <div className="container mx-auto px-4 pb-6 text-white">
            <Link to="/organizacoes" className="inline-flex items-center gap-1 text-white/90 hover:underline text-sm mb-2">
              <ArrowLeft size={14} aria-hidden="true" /> Organizações
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
              {!org.foto_url && <Building2 aria-hidden="true" />} {org.nome}
            </h1>
            <p className="flex items-center gap-1 text-white/90 mt-1">
              <MapPin size={16} aria-hidden="true" /> {[org.endereco, org.cidade].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {erro && <div className="mb-6"><Alert type="error">{erro}</Alert></div>}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 mb-12">
          <div>
            {org.descricao && (
              <>
                <h2 className="text-xl font-semibold mb-2">Sobre</h2>
                <p className="text-gray-700 whitespace-pre-line mb-8">{org.descricao}</p>
              </>
            )}
            {org.necessidades && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                <h2 className="text-lg font-semibold mb-2 text-orange-900">Do que estamos precisando</h2>
                <p className="text-orange-900/90 whitespace-pre-line">{org.necessidades}</p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            {org.pix_doacao && (
              <Card className="!p-5 border-2 border-purple-200">
                <h2 className="font-semibold text-lg flex items-center gap-2 mb-1">
                  <HandCoins className="text-purple-600" aria-hidden="true" /> Quero Doar
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  A doação é feita diretamente para a organização via Pix. O Pet Care RS não intermedeia valores.
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Chave Pix</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 bg-gray-100 rounded px-3 py-2 text-sm break-all">{org.pix_doacao}</code>
                  <button
                    onClick={copiarPix}
                    className="shrink-0 p-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
                    aria-label="Copiar chave Pix"
                  >
                    {copiado ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
                <p className="text-sm text-green-700 h-5 mt-1" role="status">{copiado ? 'Chave copiada!' : ''}</p>
              </Card>
            )}

            {linksContato.length > 0 && (
              <Card className="!p-5">
                <h2 className="font-semibold text-lg mb-3">Contato</h2>
                <ul className="space-y-2">
                  {linksContato.map(({ href, label, icon: Icon }) => (
                    <li key={href}>
                      <a
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-700 hover:text-purple-700"
                      >
                        <Icon size={16} className="text-purple-600" aria-hidden="true" /> {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </aside>
        </div>

        <section className="mb-12" aria-labelledby="t-adocao">
          <h2 id="t-adocao" className="text-2xl font-bold mb-6">Animais para adoção ({paraAdocao.length})</h2>
          {paraAdocao.length === 0 ? (
            <p className="text-gray-600">No momento não há animais disponíveis para adoção.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paraAdocao.map((a) => <PetCard key={a.id} animal={a} />)}
            </div>
          )}
        </section>

        {resgatados.length > 0 && (
          <section className="mb-12" aria-labelledby="t-resgatados">
            <h2 id="t-resgatados" className="text-2xl font-bold mb-2">Resgatados procurando a família</h2>
            <p className="text-gray-600 mb-6">Reconhece algum destes animais? Entre em contato.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {resgatados.map((a) => <PetCard key={a.id} animal={a} to={`/desaparecidos/${a.id}`} acao="Ver detalhes" />)}
            </div>
          </section>
        )}

        <section aria-labelledby="t-vagas">
          <h2 id="t-vagas" className="text-2xl font-bold mb-6">Vagas de voluntariado ({vagas.length})</h2>
          {vagas.length === 0 ? (
            <p className="text-gray-600">Nenhuma vaga aberta no momento.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vagas.map((v) => (
                <VagaCard key={v.id} vaga={v} statusInscricao={inscricoes.get(v.id)} onInscrito={recarregar} ocultarOrganizacao />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
