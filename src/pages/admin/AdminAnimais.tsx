import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, PawPrint, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { ESPECIE_LABEL, STATUS_EDITAVEIS_ORG, formatarIdade, fotoPrincipal } from '../../lib/animais';
import { STATUS_ANIMAL } from '../../lib/labels';
import { removerArquivos } from '../../lib/upload';
import type { Enums } from '../../types/database';
import { Alert, Select } from '../../components/ui';
import Spinner from '../../components/Spinner';
import { useAdmin } from './AdminLayout';

type Linha = {
  id: number;
  nome: string;
  especie: Enums<'especie'>;
  idade_meses: number | null;
  status: Enums<'status_animal'>;
  aceita_lar_temporario: boolean;
  cidade: string;
  foto: { url: string; ordem: number; storage_path: string | null }[];
  adocao: { count: number }[];
};

export default function AdminAnimais() {
  const { org } = useAdmin();
  const [animais, setAnimais] = useState<Linha[]>([]);
  const [filtro, setFiltro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    let q = supabase
      .from('animal')
      .select('id, nome, especie, idade_meses, status, cidade, aceita_lar_temporario, foto(url, ordem, storage_path), adocao(count)')
      .eq('id_organizacao', org.id)
      .eq('adocao.status', 'em_analise')
      .order('criado_em', { ascending: false });
    if (filtro) q = q.eq('status', filtro as Enums<'status_animal'>);
    const { data, error } = await q;
    if (error) setErro(traduzirErro(error));
    setAnimais((data as Linha[] | null) ?? []);
    setCarregando(false);
  }, [org.id, filtro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function mudarStatus(id: number, status: Enums<'status_animal'>) {
    setErro(null);
    const { error } = await supabase.from('animal').update({ status }).eq('id', id);
    if (error) return setErro(traduzirErro(error));
    setAnimais((lista) => lista.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  async function remover(animal: Linha) {
    if (!confirm(`Remover ${animal.nome} do sistema? As solicitações de adoção ligadas a ele também serão apagadas.`)) return;
    setErro(null);
    const caminhos = animal.foto.map((f) => f.storage_path);
    await removerArquivos(caminhos); // antes de apagar as linhas de foto, que autorizam a remoção no Storage
    const { error } = await supabase.from('animal').delete().eq('id', animal.id);
    if (error) return setErro(traduzirErro(error));
    setAnimais((lista) => lista.filter((a) => a.id !== animal.id));
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Animais</h2>
        <div className="flex gap-2">
          <label htmlFor="filtro-status" className="sr-only">Filtrar por status</label>
          <Select id="filtro-status" value={filtro} onChange={(e) => setFiltro(e.target.value)} className="!w-auto">
            <option value="">Todos os status</option>
            {STATUS_EDITAVEIS_ORG.map((s) => <option key={s} value={s}>{STATUS_ANIMAL[s].label}</option>)}
          </Select>
          <Link to="/admin/animais/novo" className="inline-flex items-center gap-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm font-semibold whitespace-nowrap">
            <Plus size={16} aria-hidden="true" /> Cadastrar
          </Link>
        </div>
      </div>

      {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}

      {carregando ? (
        <Spinner />
      ) : animais.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-600">
          Nenhum animal cadastrado{filtro && ' com este status'}.{' '}
          <Link to="/admin/animais/novo" className="text-purple-700 font-semibold hover:underline">Cadastrar o primeiro</Link>
        </div>
      ) : (
        <ul className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
          {animais.map((a) => {
            const foto = fotoPrincipal(a.foto);
            const pendentes = a.adocao[0]?.count ?? 0;
            return (
              <li key={a.id} className="p-4 flex flex-wrap items-center gap-4">
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                  {foto ? <img src={foto} alt="" className="w-full h-full object-cover" /> : <PawPrint className="w-full h-full p-4 text-gray-300" aria-hidden="true" />}
                </div>
                <div className="flex-1 min-w-[160px]">
                  <Link to={`/animais/${a.id}`} className="font-semibold hover:text-purple-700">{a.nome}</Link>
                  <p className="text-sm text-gray-500">{ESPECIE_LABEL[a.especie]} · {formatarIdade(a.idade_meses)} · {a.cidade}</p>
                  {a.aceita_lar_temporario && (
                    <span className="inline-block text-xs font-semibold bg-teal-100 text-teal-800 rounded-full px-2 py-0.5 mr-2">Precisa de lar temporário</span>
                  )}
                  {pendentes > 0 && (
                    <Link to={`/admin/adocoes?animal=${a.id}`} className="text-xs text-purple-700 font-semibold hover:underline">
                      {pendentes} {pendentes === 1 ? 'solicitação' : 'solicitações'} em análise
                    </Link>
                  )}
                </div>
                <label htmlFor={`status-${a.id}`} className="sr-only">Status de {a.nome}</label>
                <Select
                  id={`status-${a.id}`}
                  value={a.status}
                  onChange={(e) => mudarStatus(a.id, e.target.value as Enums<'status_animal'>)}
                  className="!w-auto text-sm"
                >
                  {STATUS_EDITAVEIS_ORG.map((s) => <option key={s} value={s}>{STATUS_ANIMAL[s].label}</option>)}
                </Select>
                <div className="flex gap-1">
                  <Link to={`/admin/animais/${a.id}/editar`} className="p-2 rounded-md hover:bg-gray-100 text-gray-600" aria-label={`Editar ${a.nome}`}>
                    <Pencil size={18} />
                  </Link>
                  <button onClick={() => remover(a)} className="p-2 rounded-md hover:bg-red-50 text-red-600" aria-label={`Remover ${a.nome}`}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
