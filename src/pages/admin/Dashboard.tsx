import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from './AdminLayout';

type Contagens = {
  disponiveis: number;
  adotados: number;
  adocoesPendentes: number;
  inscricoesPendentes: number;
  vagasAbertas: number;
};

export default function Dashboard() {
  const { org } = useAdmin();
  const [c, setC] = useState<Contagens | null>(null);

  useEffect(() => {
    const contar = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
    Promise.all([
      contar(supabase.from('animal').select('id', { count: 'exact', head: true }).eq('id_organizacao', org.id).in('status', ['disponivel', 'em_processo'])),
      contar(supabase.from('animal').select('id', { count: 'exact', head: true }).eq('id_organizacao', org.id).eq('status', 'adotado')),
      contar(supabase.from('adocao').select('id, animal!inner(id_organizacao)', { count: 'exact', head: true }).eq('animal.id_organizacao', org.id).eq('status', 'em_analise')),
      contar(supabase.from('inscricao_voluntariado').select('id, vaga_voluntariado!inner(id_organizacao)', { count: 'exact', head: true }).eq('vaga_voluntariado.id_organizacao', org.id).eq('status', 'pendente')),
      contar(supabase.from('vaga_voluntariado').select('id', { count: 'exact', head: true }).eq('id_organizacao', org.id).eq('status', 'aberta')),
    ]).then(([disponiveis, adotados, adocoesPendentes, inscricoesPendentes, vagasAbertas]) =>
      setC({ disponiveis, adotados, adocoesPendentes, inscricoesPendentes, vagasAbertas })
    );
  }, [org.id]);

  const cards = [
    { label: 'Solicitações de adoção em análise', valor: c?.adocoesPendentes, to: '/admin/adocoes', destaque: true },
    { label: 'Inscrições de voluntários pendentes', valor: c?.inscricoesPendentes, to: '/admin/voluntariado', destaque: true },
    { label: 'Animais disponíveis para adoção', valor: c?.disponiveis, to: '/admin/animais' },
    { label: 'Animais adotados', valor: c?.adotados, to: '/admin/relatorios' },
    { label: 'Vagas de voluntariado abertas', valor: c?.vagasAbertas, to: '/admin/voluntariado' },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className={`rounded-lg p-5 shadow-sm hover:shadow-md transition ${
              card.destaque && card.valor ? 'bg-purple-600 text-white' : 'bg-white'
            }`}
          >
            <p className="text-3xl font-bold">{card.valor ?? '–'}</p>
            <p className={`text-sm mt-1 ${card.destaque && card.valor ? 'text-purple-100' : 'text-gray-600'}`}>{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5">
        <h2 className="font-semibold mb-3">Ações rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/animais/novo" className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm font-semibold">
            <Plus size={16} aria-hidden="true" /> Cadastrar animal
          </Link>
          <Link to="/admin/voluntariado" className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-semibold">
            Abrir vaga de voluntariado <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <Link to="/admin/perfil" className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-semibold">
            Atualizar necessidades e Pix <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
