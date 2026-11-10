import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SearchX, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { CIDADES, ESPECIES } from '../../lib/constants';
import { PORTE_LABEL, SEXO_LABEL } from '../../lib/animais';
import { enviarFotosAnimal } from '../../lib/upload';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '../../components/ui';
import SeletorFotos from '../../components/SeletorFotos';

const hoje = () => new Date().toISOString().slice(0, 10);

const schema = z.object({
  tipo: z.enum(['perdido', 'encontrado']),
  nome: z.string().trim().max(80),
  especie: z.enum(['cachorro', 'gato', 'outro'], { error: 'Selecione a espécie.' }),
  raca: z.string().trim().max(80),
  sexo: z.enum(['macho', 'femea', 'desconhecido']),
  porte: z.union([z.enum(['pequeno', 'medio', 'grande']), z.literal('')]),
  idade_anos: z.string().regex(/^\d{0,2}$/, { error: 'Informe a idade em anos (número).' }),
  cidade: z.string().min(1, { error: 'Selecione a cidade.' }),
  local: z.string().trim().max(120),
  data_desaparecimento: z
    .string()
    .min(1, { error: 'Informe a data.' })
    .refine((d) => d <= hoje(), { error: 'A data não pode estar no futuro.' }),
  ultimo_local_visto: z.string().trim().min(3, { error: 'Descreva onde o animal foi visto pela última vez.' }).max(200),
  descricao: z.string().trim().min(10, { error: 'Descreva o animal (cor, marcas, coleira...), mínimo de 10 caracteres.' }).max(2000),
});
type FormData = z.infer<typeof schema>;

export default function NovoDesaparecido() {
  const { user, perfil } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [fotos, setFotos] = useState<File[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: params.get('tipo') === 'encontrado' ? 'encontrado' : 'perdido',
      nome: '',
      raca: '',
      sexo: 'desconhecido',
      porte: '',
      idade_anos: '',
      cidade: perfil?.cidade ?? '',
      local: '',
      data_desaparecimento: hoje(),
      ultimo_local_visto: '',
      descricao: '',
    },
  });

  const tipo = watch('tipo');
  const perdido = tipo === 'perdido';

  async function onSubmit(d: FormData) {
    if (!user) return;
    if (perdido && !d.nome) return setErro('Informe o nome do seu animal.');
    if (fotos.length === 0) return setErro('Adicione pelo menos uma foto: ela é essencial para reconhecer o animal.');
    setErro(null);

    setEtapa('Salvando registro...');
    const { data: animal, error } = await supabase
      .from('animal')
      .insert({
        id_usuario: user.id,
        status: d.tipo,
        nome: d.nome || 'Sem nome',
        especie: d.especie,
        raca: d.raca || null,
        sexo: d.sexo,
        porte: d.porte || null,
        idade_meses: d.idade_anos ? Number(d.idade_anos) * 12 : null,
        cidade: d.cidade,
        local: d.local || null,
        data_desaparecimento: d.data_desaparecimento,
        ultimo_local_visto: d.ultimo_local_visto,
        descricao: d.descricao,
      })
      .select('id')
      .single();

    if (error || !animal) {
      setEtapa(null);
      return setErro(traduzirErro(error));
    }

    try {
      setEtapa(`Enviando ${fotos.length} foto(s)...`);
      await enviarFotosAnimal(user.id, animal.id, fotos);
    } catch (e) {
      setEtapa(null);
      // o registro foi criado; leva o usuário até ele para tentar as fotos novamente depois
      navigate(`/desaparecidos/${animal.id}`, {
        state: { aviso: `Registro criado, mas houve um erro no envio das fotos: ${traduzirErro(e)}` },
      });
      return;
    }

    navigate(`/desaparecidos/${animal.id}`, { state: { sucesso: true } });
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Registrar animal</h1>
      <p className="text-gray-600 mb-8">
        Quanto mais detalhes e fotos, maiores as chances de alguém reconhecer o animal.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 mb-2">O que aconteceu?</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { valor: 'perdido', titulo: 'Perdi meu animal', texto: 'Meu pet desapareceu e estou procurando por ele.', icon: SearchX },
              { valor: 'encontrado', titulo: 'Encontrei um animal', texto: 'Achei um animal na rua e quero encontrar a família.', icon: Eye },
            ].map(({ valor, titulo, texto, icon: Icon }) => (
              <label
                key={valor}
                className={`flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                  tipo === valor ? 'border-purple-600 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input type="radio" value={valor} className="sr-only" {...register('tipo')} />
                <Icon className="text-purple-600 shrink-0" aria-hidden="true" />
                <span>
                  <span className="block font-semibold">{titulo}</span>
                  <span className="block text-sm text-gray-600">{texto}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Sobre o animal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="nome" label={perdido ? 'Nome do animal' : 'Nome (se souber, ex.: pela coleira)'} error={errors.nome?.message}>
              <Input id="nome" invalid={!!errors.nome} {...register('nome')} />
            </Field>
            <Field id="especie" label="Espécie" error={errors.especie?.message}>
              <Select id="especie" invalid={!!errors.especie} defaultValue="" {...register('especie')}>
                <option value="" disabled>Selecione</option>
                {ESPECIES.map((e) => <option key={e.value} value={e.value}>{e.label.replace(/s$/, '')}</option>)}
              </Select>
            </Field>
            <Field id="raca" label="Raça (opcional)">
              <Input id="raca" placeholder="Ex.: sem raça definida" {...register('raca')} />
            </Field>
            <Field id="sexo" label="Sexo">
              <Select id="sexo" {...register('sexo')}>
                {Object.entries(SEXO_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field id="porte" label="Porte">
              <Select id="porte" {...register('porte')}>
                <option value="">Não sei</option>
                {Object.entries(PORTE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field id="idade" label="Idade aproximada em anos (opcional)" error={errors.idade_anos?.message}>
              <Input id="idade" inputMode="numeric" invalid={!!errors.idade_anos} {...register('idade_anos')} />
            </Field>
          </div>
          <div className="mt-4">
            <Field id="descricao" label="Descrição" hint="Cor da pelagem, marcas, coleira, comportamento..." error={errors.descricao?.message}>
              <Textarea id="descricao" rows={4} invalid={!!errors.descricao} {...register('descricao')} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">{perdido ? 'Onde e quando desapareceu' : 'Onde e quando foi encontrado'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="cidade" label="Cidade" error={errors.cidade?.message}>
              <Select id="cidade" invalid={!!errors.cidade} {...register('cidade')}>
                <option value="">Selecione</option>
                {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field id="local" label="Bairro">
              <Input id="local" {...register('local')} />
            </Field>
            <Field id="data" label="Data" error={errors.data_desaparecimento?.message}>
              <Input id="data" type="date" max={hoje()} invalid={!!errors.data_desaparecimento} {...register('data_desaparecimento')} />
            </Field>
            <Field
              id="ultimo-local"
              label={perdido ? 'Último local visto' : 'Local onde foi encontrado'}
              error={errors.ultimo_local_visto?.message}
            >
              <Input id="ultimo-local" placeholder="Rua, ponto de referência..." invalid={!!errors.ultimo_local_visto} {...register('ultimo_local_visto')} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">Fotos</h2>
          <SeletorFotos arquivos={fotos} onChange={setFotos} />
        </Card>

        {erro && <Alert type="error">{erro}</Alert>}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto !px-8 !py-3">
            Publicar registro
          </Button>
          {etapa && <span className="text-sm text-gray-600" role="status">{etapa}</span>}
        </div>
      </form>
    </div>
  );
}
