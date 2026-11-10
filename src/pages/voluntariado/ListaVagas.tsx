import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HandHeart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { ATIVIDADES, CIDADES } from '../../lib/constants';
import { DISPONIBILIDADE } from '../../lib/labels';
import { VAGA_SELECT, type Vaga } from '../../lib/organizacoes';
import { useMinhasInscricoes } from '../../hooks/useMinhasInscricoes';
import type { Enums } from '../../types/database';
import { Alert, Field, Select } from '../../components/ui';
import VagaCard from '../../components/VagaCard';
import Spinner from '../../components/Spinner';

export default function ListaVagas() {
  const [params, setParams] = useSearchParams();
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const { inscricoes, recarregar } = useMinhasInscricoes();

  const disponibilidade = params.get('disponibilidade') ?? '';
  const atividade = params.get('atividade') ?? '';
  const cidade = params.get('cidade') ?? '';

  useEffect(() => {
    setCarregando(true);
    setErro(null);
    let query = supabase.from('vaga_voluntariado').select(VAGA_SELECT).eq('status', 'aberta');
    // "flexível" também atende quem procura dias úteis ou finais de semana
    if (disponibilidade) query = query.in('disponibilidade', [disponibilidade as Enums<'disponibilidade'>, 'flexivel']);
    if (atividade) query = query.eq('atividade', atividade);
    if (cidade) query = query.eq('organizacao.cidade', cidade);
    query.order('criado_em', { ascending: false }).then(({ data, error }) => {
      if (error) setErro(traduzirErro(error));
      setVagas(data ?? []);
      setCarregando(false);
    });
  }, [disponibilidade, atividade, cidade]);

  function atualizar(chave: string, valor: string) {
    const novo = new URLSearchParams(params);
    if (valor) novo.set(chave, valor);
    else novo.delete(chave);
    setParams(novo);
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <HandHeart className="text-purple-600" aria-hidden="true" /> Seja voluntário
      </h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        Doe seu tempo e seu talento para quem cuida dos animais. Escolha uma vaga, clique em "Quero Ajudar" e a organização entrará em contato.
      </p>

      <div className="bg-white rounded-lg shadow-md p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Field id="v-disp" label="Disponibilidade">
          <Select id="v-disp" value={disponibilidade} onChange={(e) => atualizar('disponibilidade', e.target.value)}>
            <option value="">Qualquer</option>
            <option value="dias_uteis">{DISPONIBILIDADE.dias_uteis}</option>
            <option value="finais_de_semana">{DISPONIBILIDADE.finais_de_semana}</option>
          </Select>
        </Field>
        <Field id="v-ativ" label="Atividade">
          <Select id="v-ativ" value={atividade} onChange={(e) => atualizar('atividade', e.target.value)}>
            <option value="">Todas</option>
            {ATIVIDADES.map((a) => <option key={a} value={a} className="capitalize">{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
          </Select>
        </Field>
        <Field id="v-cidade" label="Cidade">
          <Select id="v-cidade" value={cidade} onChange={(e) => atualizar('cidade', e.target.value)}>
            <option value="">Todas</option>
            {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      </div>

      {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}

      {carregando ? (
        <Spinner />
      ) : vagas.length === 0 ? (
        <p className="text-center text-gray-600 py-16">Nenhuma vaga encontrada com esses filtros.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">{vagas.length} {vagas.length === 1 ? 'vaga aberta' : 'vagas abertas'}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vagas.map((v) => (
              <VagaCard key={v.id} vaga={v} statusInscricao={inscricoes.get(v.id)} onInscrito={recarregar} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
