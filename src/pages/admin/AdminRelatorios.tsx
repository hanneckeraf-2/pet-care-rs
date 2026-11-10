import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { STATUS_ANIMAL, STATUS_INSCRICAO, formatarData } from '../../lib/labels';
import type { Enums } from '../../types/database';
import { Alert, Card } from '../../components/ui';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { useAdmin } from './AdminLayout';

type Mes = { mes: string; solicitacoes: number; aprovadas: number };
type HistoricoVoluntario = {
  id: number;
  status: Enums<'status_inscricao'>;
  criado_em: string;
  usuario: { nome: string; email: string } | null;
  vaga_voluntariado: { titulo: string };
};

function nomeMes(iso: string) {
  const [ano, mes] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export default function AdminRelatorios() {
  const { org } = useAdmin();
  const [porStatus, setPorStatus] = useState<[Enums<'status_animal'>, number][]>([]);
  const [meses, setMeses] = useState<Mes[]>([]);
  const [voluntarios, setVoluntarios] = useState<HistoricoVoluntario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const umAnoAtras = new Date();
    umAnoAtras.setMonth(umAnoAtras.getMonth() - 11, 1);
    Promise.all([
      supabase.from('animal').select('status').eq('id_organizacao', org.id),
      supabase
        .from('vw_adocoes_por_mes')
        .select('mes, solicitacoes, aprovadas')
        .eq('id_organizacao', org.id)
        .gte('mes', umAnoAtras.toISOString().slice(0, 10))
        .order('mes', { ascending: false }),
      supabase
        .from('inscricao_voluntariado')
        .select('id, status, criado_em, usuario(nome, email), vaga_voluntariado!inner(titulo, id_organizacao)')
        .eq('vaga_voluntariado.id_organizacao', org.id)
        .order('criado_em', { ascending: false })
        .limit(100),
    ]).then(([a, m, v]) => {
      const falha = a.error ?? m.error ?? v.error;
      if (falha) setErro(traduzirErro(falha));
      const contagem = new Map<Enums<'status_animal'>, number>();
      (a.data ?? []).forEach(({ status }) => contagem.set(status, (contagem.get(status) ?? 0) + 1));
      setPorStatus([...contagem.entries()].sort((x, y) => y[1] - x[1]));
      setMeses(m.data ?? []);
      setVoluntarios((v.data as HistoricoVoluntario[] | null) ?? []);
      setCarregando(false);
    });
  }, [org.id]);

  if (carregando) return <Spinner />;

  const totalAnimais = porStatus.reduce((s, [, n]) => s + n, 0);
  const totalAprovadas = meses.reduce((s, m) => s + m.aprovadas, 0);
  const totalSolicitacoes = meses.reduce((s, m) => s + m.solicitacoes, 0);
  const voluntariosAprovados = new Set(voluntarios.filter((v) => v.status === 'aprovada').map((v) => v.usuario?.email)).size;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Relatórios</h2>
      {erro && <Alert type="error">{erro}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { valor: totalAnimais, label: 'Animais cadastrados' },
          { valor: totalAprovadas, label: `Adoções aprovadas (12 meses), de ${totalSolicitacoes} solicitações` },
          { valor: voluntariosAprovados, label: 'Voluntários aprovados' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg shadow-sm p-5">
            <p className="text-3xl font-bold">{c.valor}</p>
            <p className="text-sm text-gray-600 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-3">Animais por status</h3>
          {porStatus.length === 0 ? (
            <p className="text-gray-600 text-sm">Nenhum animal cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium text-right">Quantidade</th>
                  <th className="py-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {porStatus.map(([status, n]) => (
                  <tr key={status} className="border-b border-gray-50">
                    <td className="py-2"><Badge {...STATUS_ANIMAL[status]} /></td>
                    <td className="py-2 text-right tabular-nums">{n}</td>
                    <td className="py-2 text-right tabular-nums text-gray-500">{Math.round((n / totalAnimais) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">Adoções por mês (últimos 12 meses)</h3>
          {meses.length === 0 ? (
            <p className="text-gray-600 text-sm">Nenhuma solicitação de adoção no período.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 font-medium">Mês</th>
                  <th className="py-2 font-medium text-right">Solicitações</th>
                  <th className="py-2 font-medium text-right">Aprovadas</th>
                </tr>
              </thead>
              <tbody>
                {meses.map((m) => (
                  <tr key={m.mes} className="border-b border-gray-50">
                    <td className="py-2 capitalize">{nomeMes(m.mes)}</td>
                    <td className="py-2 text-right tabular-nums">{m.solicitacoes}</td>
                    <td className="py-2 text-right tabular-nums">{m.aprovadas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold mb-3">Histórico de voluntários</h3>
        {voluntarios.length === 0 ? (
          <p className="text-gray-600 text-sm">Nenhuma inscrição de voluntariado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 font-medium">Voluntário</th>
                  <th className="py-2 font-medium">Vaga</th>
                  <th className="py-2 font-medium">Data</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {voluntarios.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50">
                    <td className="py-2">{v.usuario?.nome || v.usuario?.email || 'Usuário removido'}</td>
                    <td className="py-2">{v.vaga_voluntariado.titulo}</td>
                    <td className="py-2 tabular-nums">{formatarData(v.criado_em)}</td>
                    <td className="py-2"><Badge {...STATUS_INSCRICAO[v.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
