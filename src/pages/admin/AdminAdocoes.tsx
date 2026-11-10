import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { STATUS_ADOCAO, formatarData } from '../../lib/labels';
import type { Enums, Json } from '../../types/database';
import { Alert, Button, Textarea } from '../../components/ui';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { useAdmin } from './AdminLayout';

type Solicitacao = {
  id: number;
  status: Enums<'status_adocao'>;
  criado_em: string;
  descricao: string | null;
  dados_formulario: Json;
  animal: { id: number; nome: string };
  usuario: { nome: string; email: string; telefone: string | null; cidade: string | null } | null;
};

const ABAS: { valor: Enums<'status_adocao'> | ''; label: string }[] = [
  { valor: 'em_analise', label: 'Em análise' },
  { valor: 'aprovada', label: 'Aprovadas' },
  { valor: 'rejeitada', label: 'Não aprovadas' },
  { valor: 'cancelada', label: 'Canceladas' },
  { valor: '', label: 'Todas' },
];

const ROTULOS: Record<string, string> = {
  telefone: 'Telefone',
  cidade: 'Cidade',
  moradia: 'Moradia',
  espaco_externo: 'Espaço externo',
  outros_animais: 'Outros animais',
  motivo: 'Motivação',
};

const VALORES: Record<string, string> = { casa: 'Casa', apartamento: 'Apartamento', outro: 'Outro', sim: 'Sim', nao: 'Não' };

function respostas(json: Json): [string, string][] {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [];
  return Object.entries(ROTULOS)
    .map(([chave, rotulo]) => {
      const v = (json as Record<string, Json | undefined>)[chave];
      return [rotulo, typeof v === 'string' && v ? VALORES[v] ?? v : ''] as [string, string];
    })
    .filter(([, v]) => v);
}

export default function AdminAdocoes() {
  const { org } = useAdmin();
  const [params, setParams] = useSearchParams();
  const status = (params.get('status') ?? 'em_analise') as Enums<'status_adocao'> | '';
  const animalFiltro = params.get('animal');
  const [lista, setLista] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aberta, setAberta] = useState<number | null>(null);
  const [observacao, setObservacao] = useState('');
  const [processando, setProcessando] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    let q = supabase
      .from('adocao')
      .select('id, status, criado_em, descricao, dados_formulario, animal!inner(id, nome, id_organizacao), usuario(nome, email, telefone, cidade)')
      .eq('animal.id_organizacao', org.id)
      .order('criado_em', { ascending: false });
    if (status) q = q.eq('status', status);
    if (animalFiltro) q = q.eq('id_animal', Number(animalFiltro));
    const { data, error } = await q;
    if (error) setErro(traduzirErro(error));
    setLista((data as Solicitacao[] | null) ?? []);
    setCarregando(false);
  }, [org.id, status, animalFiltro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function mudarAba(valor: string) {
    const novo = new URLSearchParams(params);
    novo.set('status', valor);
    setParams(novo);
    setAberta(null);
  }

  async function decidir(id: number, aprovar: boolean) {
    const texto = aprovar
      ? 'Aprovar esta adoção? O animal será marcado como adotado e as outras solicitações em análise para ele serão recusadas.'
      : 'Recusar esta solicitação?';
    if (!confirm(texto)) return;
    setErro(null);
    setProcessando(id);
    const { error } = await supabase.rpc('decidir_adocao', { p_id: id, p_aprovar: aprovar, p_observacao: observacao || null });
    setProcessando(null);
    if (error) return setErro(traduzirErro(error));
    setObservacao('');
    setAberta(null);
    carregar();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Solicitações de adoção</h2>

      <div className="flex flex-wrap gap-2 mb-4" role="tablist">
        {ABAS.map((aba) => (
          <button
            key={aba.label}
            role="tab"
            aria-selected={status === aba.valor}
            onClick={() => mudarAba(aba.valor)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${status === aba.valor ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
          >
            {aba.label}
          </button>
        ))}
        {animalFiltro && (
          <button
            onClick={() => { const n = new URLSearchParams(params); n.delete('animal'); setParams(n); }}
            className="px-3 py-1.5 rounded-full text-sm bg-yellow-100 text-yellow-800"
          >
            Filtrando por um animal ✕
          </button>
        )}
      </div>

      {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}

      {carregando ? (
        <Spinner />
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-600">Nenhuma solicitação nesta categoria.</div>
      ) : (
        <ul className="space-y-3">
          {lista.map((s) => {
            const expandida = aberta === s.id;
            return (
              <li key={s.id} className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => { setAberta(expandida ? null : s.id); setObservacao(''); }}
                  className="w-full p-4 flex flex-wrap items-center justify-between gap-3 text-left"
                  aria-expanded={expandida}
                >
                  <div>
                    <p className="font-semibold">
                      {s.usuario?.nome || s.usuario?.email || 'Usuário'} <span className="font-normal text-gray-500">quer adotar</span> {s.animal.nome}
                    </p>
                    <p className="text-sm text-gray-500">{formatarData(s.criado_em)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge {...STATUS_ADOCAO[s.status]} />
                    {expandida ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                  </div>
                </button>

                {expandida && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm">
                      {s.usuario?.email && <a href={`mailto:${s.usuario.email}`} className="flex items-center gap-1 text-purple-700 hover:underline"><Mail size={14} aria-hidden="true" /> {s.usuario.email}</a>}
                      {s.usuario?.telefone && <a href={`tel:${s.usuario.telefone}`} className="flex items-center gap-1 text-purple-700 hover:underline"><Phone size={14} aria-hidden="true" /> {s.usuario.telefone}</a>}
                      <Link to={`/animais/${s.animal.id}`} className="text-purple-700 hover:underline">Ver {s.animal.nome}</Link>
                    </div>

                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {respostas(s.dados_formulario).map(([rotulo, valor]) => (
                        <div key={rotulo} className={rotulo === 'Motivação' ? 'sm:col-span-2' : ''}>
                          <dt className="text-gray-500">{rotulo}</dt>
                          <dd className="text-gray-900 whitespace-pre-line">{valor}</dd>
                        </div>
                      ))}
                    </dl>

                    {s.descricao && <p className="text-sm bg-gray-50 rounded p-3"><strong>Observação:</strong> {s.descricao}</p>}

                    {s.status === 'em_analise' && (
                      <div className="space-y-3 border-t border-gray-100 pt-4">
                        <label htmlFor={`obs-${s.id}`} className="block text-sm font-medium text-gray-700">
                          Observação para o adotante (opcional)
                        </label>
                        <Textarea id={`obs-${s.id}`} rows={2} maxLength={500} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                        <div className="flex gap-2">
                          <Button onClick={() => decidir(s.id, true)} loading={processando === s.id}>Aprovar adoção</Button>
                          <Button variant="secondary" onClick={() => decidir(s.id, false)} disabled={processando === s.id}>Recusar</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
