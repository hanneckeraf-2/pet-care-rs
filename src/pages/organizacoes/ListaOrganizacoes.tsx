import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building2, MapPin, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { CIDADES } from '../../lib/constants';
import { STATUS_ADOTAVEIS } from '../../lib/animais';
import { Alert, Input, Select } from '../../components/ui';
import Spinner from '../../components/Spinner';

type OrgResumo = {
  id: number;
  nome: string;
  cidade: string;
  descricao: string | null;
  foto_url: string | null;
  animal: { count: number }[];
  vaga_voluntariado: { count: number }[];
};

export default function ListaOrganizacoes() {
  const [params, setParams] = useSearchParams();
  const [orgs, setOrgs] = useState<OrgResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const cidade = params.get('cidade') ?? '';
  const [termo, setTermo] = useState('');

  useEffect(() => {
    setCarregando(true);
    let query = supabase
      .from('organizacao')
      .select('id, nome, cidade, descricao, foto_url, animal(count), vaga_voluntariado(count)')
      .in('animal.status', STATUS_ADOTAVEIS)
      .eq('vaga_voluntariado.status', 'aberta')
      .order('nome');
    if (cidade) query = query.eq('cidade', cidade);
    query.then(({ data, error }) => {
      if (error) setErro(traduzirErro(error));
      setOrgs((data as OrgResumo[] | null) ?? []);
      setCarregando(false);
    });
  }, [cidade]);

  const termoNormalizado = termo.trim().toLocaleLowerCase('pt-BR');
  const visiveis = termoNormalizado
    ? orgs.filter((o) => `${o.nome} ${o.descricao ?? ''}`.toLocaleLowerCase('pt-BR').includes(termoNormalizado))
    : orgs;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Organizações</h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        ONGs, abrigos e protetores que cuidam dos animais da região. Conheça o trabalho de cada uma, adote, seja voluntário ou faça uma doação.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3 mb-8">
        <div className="relative">
          <label htmlFor="o-termo" className="sr-only">Buscar organização</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
          <Input id="o-termo" className="!pl-10" placeholder="Buscar por nome..." value={termo} onChange={(e) => setTermo(e.target.value)} />
        </div>
        <label htmlFor="o-cidade" className="sr-only">Cidade</label>
        <Select
          id="o-cidade"
          value={cidade}
          onChange={(e) => setParams(e.target.value ? { cidade: e.target.value } : {})}
        >
          <option value="">Todas as cidades</option>
          {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>

      {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}

      {carregando ? (
        <Spinner />
      ) : visiveis.length === 0 ? (
        <p className="text-center text-gray-600 py-16">Nenhuma organização encontrada.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visiveis.map((o) => (
            <Link
              key={o.id}
              to={`/organizacoes/${o.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition flex flex-col"
            >
              <div className="h-40 bg-purple-50">
                {o.foto_url ? (
                  <img src={o.foto_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-14 h-14 text-purple-200" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h2 className="text-xl font-semibold mb-1">{o.nome}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                  <MapPin size={14} aria-hidden="true" /> {o.cidade}
                </p>
                {o.descricao && <p className="text-gray-700 text-sm line-clamp-3 mb-4">{o.descricao}</p>}
                <div className="mt-auto flex gap-4 text-sm text-purple-700 font-medium">
                  <span>{o.animal[0]?.count ?? 0} para adoção</span>
                  <span>{o.vaga_voluntariado[0]?.count ?? 0} vagas abertas</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
