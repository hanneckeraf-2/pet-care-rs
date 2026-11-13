import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Pencil, Phone, Plus, Trash2, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { ATIVIDADES } from '../../lib/constants';
import { DISPONIBILIDADE, STATUS_INSCRICAO, formatarData } from '../../lib/labels';
import type { Enums } from '../../types/database';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '../../components/ui';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';
import { useAdmin } from './AdminLayout';
import Avatar from '../../components/Avatar';

type Inscricao = {
  id: number;
  status: Enums<'status_inscricao'>;
  mensagem: string | null;
  criado_em: string;
  usuario: { nome: string; email: string; telefone: string | null; foto_url: string | null } | null;
};
type VagaAdmin = {
  id: number;
  titulo: string;
  atividade: string;
  descricao: string | null;
  disponibilidade: Enums<'disponibilidade'>;
  status: Enums<'status_vaga'>;
  inscricao_voluntariado: Inscricao[];
};

const schema = z.object({
  titulo: z.string().trim().min(3, { error: 'Informe um título.' }).max(120),
  atividade: z.string().min(1, { error: 'Selecione a atividade.' }),
  disponibilidade: z.enum(['dias_uteis', 'finais_de_semana', 'flexivel']),
  descricao: z.string().trim().max(1000),
});
type FormData = z.infer<typeof schema>;
const VAZIO: FormData = { titulo: '', atividade: '', disponibilidade: 'flexivel', descricao: '' };

export default function AdminVoluntariado() {
  const { org } = useAdmin();
  const [vagas, setVagas] = useState<VagaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<number | 'nova' | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: VAZIO,
  });

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from('vaga_voluntariado')
      .select('id, titulo, atividade, descricao, disponibilidade, status, inscricao_voluntariado(id, status, mensagem, criado_em, usuario(nome, email, telefone, foto_url))')
      .eq('id_organizacao', org.id)
      .order('status')
      .order('criado_em', { ascending: false })
      .order('criado_em', { referencedTable: 'inscricao_voluntariado', ascending: false });
    if (error) setErro(traduzirErro(error));
    setVagas((data as VagaAdmin[] | null) ?? []);
    setCarregando(false);
  }, [org.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirForm(vaga?: VagaAdmin) {
    setEditando(vaga ? vaga.id : 'nova');
    reset(vaga ? { titulo: vaga.titulo, atividade: vaga.atividade, disponibilidade: vaga.disponibilidade, descricao: vaga.descricao ?? '' } : VAZIO);
  }

  async function salvar(d: FormData) {
    setErro(null);
    const dados = { ...d, descricao: d.descricao || null };
    const { error } =
      editando === 'nova'
        ? await supabase.from('vaga_voluntariado').insert({ ...dados, id_organizacao: org.id })
        : await supabase.from('vaga_voluntariado').update(dados).eq('id', editando as number);
    if (error) return setErro(traduzirErro(error));
    setEditando(null);
    carregar();
  }

  async function alternarStatus(vaga: VagaAdmin) {
    const status = vaga.status === 'aberta' ? 'encerrada' : 'aberta';
    const { error } = await supabase.from('vaga_voluntariado').update({ status }).eq('id', vaga.id);
    if (error) return setErro(traduzirErro(error));
    carregar();
  }

  async function remover(vaga: VagaAdmin) {
    if (!confirm(`Excluir a vaga "${vaga.titulo}" e todas as inscrições dela?`)) return;
    const { error } = await supabase.from('vaga_voluntariado').delete().eq('id', vaga.id);
    if (error) return setErro(traduzirErro(error));
    carregar();
  }

  async function decidirInscricao(id: number, status: 'aprovada' | 'rejeitada') {
    const { error } = await supabase.from('inscricao_voluntariado').update({ status }).eq('id', id);
    if (error) return setErro(traduzirErro(error));
    carregar();
  }

  const formulario = (
    <Card className="mb-6 border-2 border-purple-200">
      <form onSubmit={handleSubmit(salvar)} className="space-y-4" noValidate>
        <h3 className="font-semibold">{editando === 'nova' ? 'Nova vaga' : 'Editar vaga'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <Field id="titulo" label="Título" error={errors.titulo?.message}>
              <Input id="titulo" placeholder="Ex.: Apoio veterinário aos sábados" invalid={!!errors.titulo} {...register('titulo')} />
            </Field>
          </div>
          <Field id="atividade" label="Atividade" error={errors.atividade?.message}>
            <Select id="atividade" invalid={!!errors.atividade} {...register('atividade')}>
              <option value="">Selecione</option>
              {ATIVIDADES.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
            </Select>
          </Field>
          <Field id="disp" label="Disponibilidade">
            <Select id="disp" {...register('disponibilidade')}>
              {Object.entries(DISPONIBILIDADE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
        </div>
        <Field id="desc" label="Descrição">
          <Textarea id="desc" rows={3} placeholder="O que o voluntário vai fazer, horários, requisitos..." {...register('descricao')} />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting}>Salvar</Button>
          <Button type="button" variant="secondary" onClick={() => setEditando(null)}>Cancelar</Button>
        </div>
      </form>
    </Card>
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Voluntariado</h2>
        {editando === null && (
          <Button onClick={() => abrirForm()} className="text-sm">
            <Plus size={16} aria-hidden="true" /> Nova vaga
          </Button>
        )}
      </div>

      {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}
      {editando === 'nova' && formulario}

      {carregando ? (
        <Spinner />
      ) : vagas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-600">Nenhuma vaga cadastrada.</div>
      ) : (
        <ul className="space-y-4">
          {vagas.map((v) => {
            const ativas = v.inscricao_voluntariado.filter((i) => i.status !== 'cancelada');
            const pendentes = ativas.filter((i) => i.status === 'pendente').length;
            if (editando === v.id) return <li key={v.id}>{formulario}</li>;
            return (
              <li key={v.id} className={`bg-white rounded-lg shadow-sm p-5 ${v.status === 'encerrada' ? 'opacity-70' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg">{v.titulo}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {v.atividade} · {DISPONIBILIDADE[v.disponibilidade]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label={v.status === 'aberta' ? 'Aberta' : 'Encerrada'} cor={v.status === 'aberta' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'} />
                    <button onClick={() => alternarStatus(v)} className="text-sm text-purple-700 hover:underline">
                      {v.status === 'aberta' ? 'Encerrar' : 'Reabrir'}
                    </button>
                    <button onClick={() => abrirForm(v)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" aria-label={`Editar ${v.titulo}`}><Pencil size={16} /></button>
                    <button onClick={() => remover(v)} className="p-1.5 rounded hover:bg-red-50 text-red-600" aria-label={`Excluir ${v.titulo}`}><Trash2 size={16} /></button>
                  </div>
                </div>
                {v.descricao && <p className="text-sm text-gray-700 mt-2">{v.descricao}</p>}

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Users size={16} aria-hidden="true" /> {ativas.length} {ativas.length === 1 ? 'inscrição' : 'inscrições'}
                    {pendentes > 0 && <Badge label={`${pendentes} pendente${pendentes > 1 ? 's' : ''}`} cor="bg-yellow-100 text-yellow-800" />}
                  </p>
                  {ativas.length > 0 && (
                    <ul className="divide-y divide-gray-100">
                      {ativas.map((i) => (
                        <li key={i.id} className="py-3 flex flex-wrap items-start justify-between gap-3">
                          <div className="text-sm flex items-start gap-3">
                            <Avatar url={i.usuario?.foto_url} nome={i.usuario?.nome || i.usuario?.email} className="w-9 h-9 text-xs" />
                            <div>
                            <p className="font-semibold">{i.usuario?.nome || i.usuario?.email || 'Usuário'} <span className="font-normal text-gray-500">· {formatarData(i.criado_em)}</span></p>
                            <div className="flex flex-wrap gap-3 text-purple-700">
                              {i.usuario?.email && <a href={`mailto:${i.usuario.email}`} className="flex items-center gap-1 hover:underline"><Mail size={12} aria-hidden="true" /> {i.usuario.email}</a>}
                              {i.usuario?.telefone && <a href={`tel:${i.usuario.telefone}`} className="flex items-center gap-1 hover:underline"><Phone size={12} aria-hidden="true" /> {i.usuario.telefone}</a>}
                            </div>
                            {i.mensagem && <p className="text-gray-700 mt-1 whitespace-pre-line">{i.mensagem}</p>}
                            </div>
                          </div>
                          {i.status === 'pendente' ? (
                            <div className="flex gap-2">
                              <Button className="!px-3 !py-1 text-sm" onClick={() => decidirInscricao(i.id, 'aprovada')}>Aprovar</Button>
                              <Button variant="secondary" className="!px-3 !py-1 text-sm" onClick={() => decidirInscricao(i.id, 'rejeitada')}>Recusar</Button>
                            </div>
                          ) : (
                            <Badge {...STATUS_INSCRICAO[i.status]} />
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
