import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { CIDADES, ESPECIES } from '../../lib/constants';
import { PORTE_LABEL, SEXO_LABEL, STATUS_EDITAVEIS_ORG } from '../../lib/animais';
import { STATUS_ANIMAL } from '../../lib/labels';
import { MAX_FOTOS, enviarFotosAnimal, removerArquivos } from '../../lib/upload';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '../../components/ui';
import SeletorFotos from '../../components/SeletorFotos';
import Spinner from '../../components/Spinner';
import { useAdmin } from './AdminLayout';

const schema = z.object({
  nome: z.string().trim().min(1, { error: 'Informe o nome.' }).max(80),
  especie: z.enum(['cachorro', 'gato', 'outro'], { error: 'Selecione a espécie.' }),
  raca: z.string().trim().max(80),
  sexo: z.enum(['macho', 'femea', 'desconhecido']),
  porte: z.union([z.enum(['pequeno', 'medio', 'grande']), z.literal('')]),
  idade_anos: z.string().regex(/^\d{0,2}$/, { error: 'Número de anos inválido.' }),
  idade_meses_extra: z.string().regex(/^(\d|1[01])?$/, { error: 'Meses de 0 a 11.' }),
  status: z.enum(['disponivel', 'em_processo', 'em_lar_temporario', 'adotado', 'resgatado', 'encontrado', 'reunido']),
  cidade: z.string().min(1, { error: 'Selecione a cidade.' }),
  local: z.string().trim().max(120),
  descricao: z.string().trim().max(2000),
  aceita_lar_temporario: z.boolean(),
});
type FormData = z.infer<typeof schema>;

type FotoExistente = { id: number; url: string; ordem: number; storage_path: string | null };

export default function AnimalForm() {
  const { id } = useParams();
  const editando = id !== undefined;
  const animalId = Number(id);
  const { org } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(editando);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [fotosExistentes, setFotosExistentes] = useState<FotoExistente[]>([]);
  const [novasFotos, setNovasFotos] = useState<File[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: '', raca: '', sexo: 'desconhecido', porte: '', idade_anos: '', idade_meses_extra: '',
      status: 'disponivel', cidade: org.cidade, local: '', descricao: '', aceita_lar_temporario: false,
    },
  });

  useEffect(() => {
    if (!editando) return;
    supabase
      .from('animal')
      .select('*, foto(id, url, ordem, storage_path)')
      .eq('id', animalId)
      .eq('id_organizacao', org.id)
      .order('ordem', { referencedTable: 'foto' })
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setNaoEncontrado(true);
        } else {
          const meses = data.idade_meses;
          reset({
            nome: data.nome,
            especie: data.especie,
            raca: data.raca ?? '',
            sexo: data.sexo,
            porte: data.porte ?? '',
            idade_anos: meses !== null ? String(Math.floor(meses / 12)) : '',
            idade_meses_extra: meses !== null ? String(meses % 12) : '',
            status: (STATUS_EDITAVEIS_ORG as string[]).includes(data.status) ? (data.status as FormData['status']) : 'disponivel',
            cidade: data.cidade,
            local: data.local ?? '',
            descricao: data.descricao ?? '',
            aceita_lar_temporario: data.aceita_lar_temporario,
          });
          setFotosExistentes(data.foto);
        }
        setCarregando(false);
      });
  }, [editando, animalId, org.id, reset]);

  async function removerFotoExistente(foto: FotoExistente) {
    if (!confirm('Remover esta foto?')) return;
    await removerArquivos([foto.storage_path]);
    const { error } = await supabase.from('foto').delete().eq('id', foto.id);
    if (error) return setErro(traduzirErro(error));
    setFotosExistentes((l) => l.filter((f) => f.id !== foto.id));
  }

  async function onSubmit(d: FormData) {
    if (!user) return;
    setErro(null);
    const idade =
      d.idade_anos === '' && d.idade_meses_extra === '' ? null : Number(d.idade_anos || 0) * 12 + Number(d.idade_meses_extra || 0);
    const dados = {
      nome: d.nome,
      especie: d.especie,
      raca: d.raca || null,
      sexo: d.sexo,
      porte: d.porte || null,
      idade_meses: idade,
      status: d.status,
      cidade: d.cidade,
      local: d.local || null,
      descricao: d.descricao || null,
      aceita_lar_temporario: d.aceita_lar_temporario,
    };

    let idSalvo = animalId;
    if (editando) {
      const { error } = await supabase.from('animal').update(dados).eq('id', animalId);
      if (error) return setErro(traduzirErro(error));
    } else {
      const { data, error } = await supabase.from('animal').insert({ ...dados, id_organizacao: org.id }).select('id').single();
      if (error || !data) return setErro(traduzirErro(error));
      idSalvo = data.id;
    }

    if (novasFotos.length > 0) {
      try {
        const ordemInicial = fotosExistentes.reduce((m, f) => Math.max(m, f.ordem + 1), 0);
        await enviarFotosAnimal(user.id, idSalvo, novasFotos, ordemInicial);
      } catch (e) {
        setErro(`Dados salvos, mas houve erro ao enviar as fotos: ${traduzirErro(e)}`);
        if (!editando) navigate(`/admin/animais/${idSalvo}/editar`, { replace: true });
        return;
      }
    }
    navigate('/admin/animais');
  }

  if (carregando) return <Spinner />;
  if (naoEncontrado) return <Alert type="error">Animal não encontrado nesta organização.</Alert>;

  const vagasFoto = MAX_FOTOS - fotosExistentes.length;

  return (
    <div>
      <Link to="/admin/animais" className="inline-flex items-center gap-1 text-purple-700 hover:underline text-sm mb-4">
        <ArrowLeft size={14} aria-hidden="true" /> Voltar para animais
      </Link>
      <h2 className="text-xl font-semibold mb-4">{editando ? 'Editar animal' : 'Cadastrar animal'}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="nome" label="Nome" error={errors.nome?.message}>
              <Input id="nome" invalid={!!errors.nome} {...register('nome')} />
            </Field>
            <Field id="status" label="Status">
              <Select id="status" {...register('status')}>
                {STATUS_EDITAVEIS_ORG.map((s) => <option key={s} value={s}>{STATUS_ANIMAL[s].label}</option>)}
              </Select>
            </Field>
            <Field id="especie" label="Espécie" error={errors.especie?.message}>
              <Select id="especie" invalid={!!errors.especie} defaultValue="" {...register('especie')}>
                <option value="" disabled>Selecione</option>
                {ESPECIES.map((e) => <option key={e.value} value={e.value}>{e.label.replace(/s$/, '')}</option>)}
              </Select>
            </Field>
            <Field id="raca" label="Raça">
              <Input id="raca" placeholder="Ex.: sem raça definida" {...register('raca')} />
            </Field>
            <Field id="sexo" label="Sexo">
              <Select id="sexo" {...register('sexo')}>
                {Object.entries(SEXO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field id="porte" label="Porte">
              <Select id="porte" {...register('porte')}>
                <option value="">Não informado</option>
                {Object.entries(PORTE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="anos" label="Idade (anos)" error={errors.idade_anos?.message}>
                <Input id="anos" inputMode="numeric" invalid={!!errors.idade_anos} {...register('idade_anos')} />
              </Field>
              <Field id="meses" label="+ meses" error={errors.idade_meses_extra?.message}>
                <Input id="meses" inputMode="numeric" invalid={!!errors.idade_meses_extra} {...register('idade_meses_extra')} />
              </Field>
            </div>
            <Field id="cidade" label="Cidade" error={errors.cidade?.message}>
              <Select id="cidade" invalid={!!errors.cidade} {...register('cidade')}>
                <option value="">Selecione</option>
                {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field id="local" label="Bairro / local">
              <Input id="local" {...register('local')} />
            </Field>
          </div>
          <div className="mt-4">
            <Field id="descricao" label="Descrição" hint="Temperamento, saúde, vacinas, castração, se convive com crianças ou outros animais...">
              <Textarea id="descricao" rows={4} {...register('descricao')} />
            </Field>
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-md border border-teal-200 bg-teal-50 p-3 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-4 h-4 accent-teal-600" {...register('aceita_lar_temporario')} />
            <span className="text-sm">
              <span className="block font-semibold text-teal-900">Precisa de lar temporário</span>
              <span className="text-teal-800">
                Mostra o botão "Quero ser Lar Temporário" na página do animal, para quem não pode adotar acolhê-lo por um período.
              </span>
            </span>
          </label>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">Fotos</h3>
          {fotosExistentes.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
              {fotosExistentes.map((f) => (
                <div key={f.id} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removerFotoExistente(f)}
                    className="absolute top-1 right-1 bg-white/90 rounded-full p-1 hover:bg-white text-red-600"
                    aria-label="Remover foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {vagasFoto > 0 ? (
            <SeletorFotos arquivos={novasFotos} onChange={setNovasFotos} max={vagasFoto} />
          ) : (
            <p className="text-sm text-gray-500">Limite de {MAX_FOTOS} fotos atingido. Remova uma para adicionar outra.</p>
          )}
        </Card>

        {erro && <Alert type="error">{erro}</Alert>}

        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>{editando ? 'Salvar alterações' : 'Cadastrar animal'}</Button>
          <Link to="/admin/animais" className="px-5 py-2 rounded-md border border-gray-300 font-semibold hover:bg-gray-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
