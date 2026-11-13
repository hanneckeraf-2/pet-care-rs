import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, HandHeart, Heart, MessageCircle, PawPrint, Plus, Settings } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { CIDADES } from '../../lib/constants';
import { STATUS_ADOCAO, STATUS_ANIMAL, STATUS_INSCRICAO, formatarData } from '../../lib/labels';
import { TIPO_SOLICITACAO, fotoPrincipal } from '../../lib/animais';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Card, Field, Input, Select } from '../../components/ui';
import Badge from '../../components/Badge';
import Avatar from '../../components/Avatar';
import EditorFotoIdentificacao from '../../components/EditorFotoIdentificacao';
import { definirFotoIdentificacao, removerFotoIdentificacao } from '../../lib/upload';
import type { Enums } from '../../types/database';

const schema = z.object({
  nome: z.string().trim().min(2, { error: 'Informe seu nome.' }).max(120),
  telefone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[\d\s()+-]*$/, { error: 'Use apenas números, espaços, parênteses e hífen.' }),
  cidade: z.string(),
  alertas_ativos: z.boolean(),
  notificar_email: z.boolean(),
});
type FormData = z.infer<typeof schema>;

type Adocao = {
  id: number;
  status: Enums<'status_adocao'>;
  criado_em: string;
  tipo: Enums<'tipo_solicitacao'>;
  animal: { id: number; nome: string } | null;
};
type Registro = {
  id: number;
  nome: string;
  status: Enums<'status_animal'>;
  cidade: string;
  criado_em: string;
  foto: { url: string; ordem: number }[];
  mensagem_animal: { count: number }[];
};
type Inscricao = {
  id: number;
  status: Enums<'status_inscricao'>;
  criado_em: string;
  vaga_voluntariado: { titulo: string; organizacao: { nome: string } | null } | null;
};

export default function Perfil() {
  const { user, perfil, recarregarPerfil } = useAuth();
  const location = useLocation();
  const [mensagem, setMensagem] = useState<string | null>((location.state as { mensagem?: string } | null)?.mensagem ?? null);
  const [erro, setErro] = useState<string | null>(null);
  const [adocoes, setAdocoes] = useState<Adocao[]>([]);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (perfil) {
      reset({
        nome: perfil.nome,
        telefone: perfil.telefone ?? '',
        cidade: perfil.cidade ?? '',
        alertas_ativos: perfil.alertas_ativos,
        notificar_email: perfil.notificar_email,
      });
    }
  }, [perfil, reset]);

  const carregarHistorico = useCallback(async () => {
    if (!user) return;
    const [ad, ins, reg] = await Promise.all([
      supabase
        .from('adocao')
        .select('id, status, criado_em, tipo, animal(id, nome)')
        .eq('id_usuario', user.id)
        .order('criado_em', { ascending: false }),
      supabase
        .from('inscricao_voluntariado')
        .select('id, status, criado_em, vaga_voluntariado(titulo, organizacao(nome))')
        .eq('id_usuario', user.id)
        .order('criado_em', { ascending: false }),
      // animais que o próprio usuário registrou como perdidos/encontrados
      supabase
        .from('animal')
        .select('id, nome, status, cidade, criado_em, foto(url, ordem), mensagem_animal(count)')
        .eq('id_usuario', user.id)
        .is('id_organizacao', null)
        .order('criado_em', { ascending: false }),
    ]);
    const falha = ad.error ?? ins.error ?? reg.error;
    if (falha) setErro(traduzirErro(falha));
    setRegistros((reg.data as Registro[] | null) ?? []);
    setAdocoes((ad.data as Adocao[] | null) ?? []);
    setInscricoes((ins.data as Inscricao[] | null) ?? []);
  }, [user]);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  async function onSubmit(dados: FormData) {
    if (!user) return;
    setErro(null);
    setMensagem(null);
    const { error } = await supabase
      .from('usuario')
      .update({
        nome: dados.nome,
        telefone: dados.telefone || null,
        cidade: dados.cidade || null,
        alertas_ativos: dados.alertas_ativos,
        notificar_email: dados.notificar_email,
      })
      .eq('id', user.id);
    if (error) return setErro(traduzirErro(error));
    await recarregarPerfil();
    setMensagem('Perfil atualizado.');
  }

  async function cancelarAdocao(id: number) {
    if (!confirm('Cancelar esta solicitação?')) return;
    const { error } = await supabase.from('adocao').update({ status: 'cancelada' }).eq('id', id);
    if (error) return setErro(traduzirErro(error));
    carregarHistorico();
  }

  async function cancelarInscricao(id: number) {
    if (!confirm('Cancelar esta inscrição de voluntariado?')) return;
    const { error } = await supabase.from('inscricao_voluntariado').update({ status: 'cancelada' }).eq('id', id);
    if (error) return setErro(traduzirErro(error));
    carregarHistorico();
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Meu perfil</h1>
          <p className="text-gray-600">{user?.email}</p>
        </div>
        <Link to="/configuracoes" className="inline-flex items-center gap-2 text-purple-700 font-semibold hover:underline">
          <Settings size={18} aria-hidden="true" /> Configurações da conta
        </Link>
      </div>

      <div className="space-y-4 mb-6">
        {mensagem && <Alert type="success">{mensagem}</Alert>}
        {erro && <Alert type="error">{erro}</Alert>}
      </div>

      {user && (
        <Card className="mb-8">
          <h2 className="text-xl font-semibold mb-1">Foto de perfil</h2>
          <p className="text-sm text-gray-600 mb-4">
            Ajuda as organizações a reconhecer você nas solicitações de adoção, lar temporário e voluntariado.
          </p>
          <EditorFotoIdentificacao
            rotulo="foto de perfil"
            temFoto={!!perfil?.foto_url}
            dica="Prefira uma foto de rosto, quadrada."
            previa={<Avatar url={perfil?.foto_url} nome={perfil?.nome || user.email} className="w-24 h-24 text-3xl" alt="Sua foto de perfil" />}
            onTrocar={async (arquivo) => {
              await definirFotoIdentificacao(user.id, { tipo: 'perfil', idUsuario: user.id }, arquivo);
              await recarregarPerfil();
            }}
            onRemover={async () => {
              await removerFotoIdentificacao({ tipo: 'perfil', idUsuario: user.id });
              await recarregarPerfil();
            }}
          />
        </Card>
      )}

      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Informações pessoais</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
          <Field id="nome" label="Nome" error={errors.nome?.message}>
            <Input id="nome" autoComplete="name" invalid={!!errors.nome} {...register('nome')} />
          </Field>
          <Field id="telefone" label="Telefone / WhatsApp" error={errors.telefone?.message}>
            <Input id="telefone" type="tel" autoComplete="tel" placeholder="(51) 99999-9999" invalid={!!errors.telefone} {...register('telefone')} />
          </Field>
          <Field id="cidade" label="Cidade">
            <Select id="cidade" {...register('cidade')}>
              <option value="">Selecione</option>
              {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <fieldset className="sm:col-span-2 space-y-2">
            <legend className="text-sm font-medium text-gray-700 mb-1">Notificações</legend>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-purple-600" {...register('alertas_ativos')} />
              Avise-me sobre novos animais na minha cidade
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-purple-600" {...register('notificar_email')} />
              Receber as notificações também por e-mail
            </label>
          </fieldset>
          <div className="sm:col-span-2">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Salvar alterações</Button>
          </div>
        </form>
      </Card>

      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Heart className="text-purple-600" size={20} aria-hidden="true" /> Minhas solicitações de adoção e lar temporário
        </h2>
        {adocoes.length === 0 ? (
          <p className="text-gray-600">
            Você ainda não fez nenhuma solicitação. <Link to="/animais" className="text-purple-700 font-semibold hover:underline">Conheça os animais</Link>
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {adocoes.map((a) => (
              <li key={a.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {a.animal ? (
                    <Link to={`/animais/${a.animal.id}`} className="font-semibold hover:text-purple-700">{a.animal.nome}</Link>
                  ) : (
                    <span className="font-semibold text-gray-500">Animal removido</span>
                  )}
                  <span className="text-sm text-gray-500 ml-2">{formatarData(a.criado_em)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge {...TIPO_SOLICITACAO[a.tipo]} />
                  <Badge {...STATUS_ADOCAO[a.status]} />
                  {a.status === 'em_analise' && (
                    <button onClick={() => cancelarAdocao(a.id)} className="text-sm text-red-600 hover:underline">Cancelar</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} aria-hidden="true" /> Meus animais registrados
          </h2>
          {registros.length > 0 && (
            <Link to="/desaparecidos/novo" className="inline-flex items-center gap-1 text-sm text-purple-700 font-semibold hover:underline">
              <Plus size={16} aria-hidden="true" /> Registrar animal
            </Link>
          )}
        </div>
        {registros.length === 0 ? (
          <p className="text-gray-600">
            Você não registrou nenhum animal perdido ou encontrado.{' '}
            <Link to="/desaparecidos/novo" className="text-purple-700 font-semibold hover:underline">Registrar animal</Link>
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {registros.map((r) => {
              const foto = fotoPrincipal(r.foto);
              const mensagens = r.mensagem_animal[0]?.count ?? 0;
              return (
                <li key={r.id}>
                  <Link to={`/desaparecidos/${r.id}`} className="py-3 flex items-center gap-4 hover:bg-gray-50 -mx-2 px-2 rounded-md">
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 shrink-0">
                      {foto ? (
                        <img src={foto} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <PawPrint className="w-full h-full p-3 text-gray-300" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{r.nome}</p>
                      <p className="text-sm text-gray-500">
                        {r.cidade} · registrado em {formatarData(r.criado_em)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge {...STATUS_ANIMAL[r.status]} />
                      <span className={`text-xs flex items-center gap-1 ${mensagens > 0 ? 'text-purple-700 font-semibold' : 'text-gray-500'}`}>
                        <MessageCircle size={12} aria-hidden="true" />
                        {mensagens === 0 ? 'Nenhuma mensagem' : mensagens === 1 ? '1 mensagem' : `${mensagens} mensagens`}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <HandHeart className="text-purple-600" size={20} aria-hidden="true" /> Meu voluntariado
        </h2>
        {inscricoes.length === 0 ? (
          <p className="text-gray-600">
            Nenhuma inscrição ainda. <Link to="/voluntariado" className="text-purple-700 font-semibold hover:underline">Veja as vagas</Link>
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {inscricoes.map((i) => (
              <li key={i.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold">{i.vaga_voluntariado?.titulo ?? 'Vaga removida'}</span>
                  {i.vaga_voluntariado?.organizacao && (
                    <span className="text-sm text-gray-500 ml-2">{i.vaga_voluntariado.organizacao.nome}</span>
                  )}
                  <span className="text-sm text-gray-500 ml-2">{formatarData(i.criado_em)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge {...STATUS_INSCRICAO[i.status]} />
                  {i.status === 'pendente' && (
                    <button onClick={() => cancelarInscricao(i.id)} className="text-sm text-red-600 hover:underline">Cancelar</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
