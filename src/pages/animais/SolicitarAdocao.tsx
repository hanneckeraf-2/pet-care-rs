import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { CIDADES } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Field, Input, Select, Textarea } from '../../components/ui';

const schema = z.object({
  telefone: z
    .string()
    .trim()
    .min(8, { error: 'Informe um telefone para contato.' })
    .max(20)
    .regex(/^[\d\s()+-]+$/, { error: 'Use apenas números, espaços, parênteses e hífen.' }),
  cidade: z.string().min(1, { error: 'Selecione sua cidade.' }),
  moradia: z.enum(['casa', 'apartamento', 'outro'], { error: 'Selecione o tipo de moradia.' }),
  espaco_externo: z.enum(['sim', 'nao'], { error: 'Informe se há espaço externo.' }),
  outros_animais: z.string().trim().max(500),
  motivo: z.string().trim().min(20, { error: 'Conte um pouco mais (mínimo de 20 caracteres).' }).max(2000),
  concordancia_familia: z.literal(true, { error: 'É necessário que todos na casa concordem com a adoção.' }),
  ciente_responsabilidade: z.literal(true, { error: 'Confirme que está ciente das responsabilidades.' }),
});
type FormData = z.infer<typeof schema>;

type Props = {
  animalId: number;
  animalNome: string;
  onEnviado: () => void;
  onCancelar: () => void;
};

export default function SolicitarAdocao({ animalId, animalNome, onEnviado, onCancelar }: Props) {
  const { user, perfil } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      telefone: perfil?.telefone ?? '',
      cidade: perfil?.cidade ?? '',
      outros_animais: '',
      motivo: '',
    },
  });

  async function onSubmit(dados: FormData) {
    if (!user) return;
    setErro(null);
    const { error } = await supabase.from('adocao').insert({
      id_usuario: user.id,
      id_animal: animalId,
      dados_formulario: { ...dados, nome: perfil?.nome ?? '', email: user.email ?? '' },
    });
    if (error) {
      if (error.code === '23505') return setErro('Você já tem uma solicitação em análise para este animal.');
      return setErro(traduzirErro(error));
    }
    // guarda telefone/cidade no perfil se ainda não estiverem preenchidos
    if (!perfil?.telefone || !perfil?.cidade) {
      await supabase
        .from('usuario')
        .update({ telefone: perfil?.telefone || dados.telefone, cidade: perfil?.cidade || dados.cidade })
        .eq('id', user.id);
    }
    onEnviado();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h2 className="text-xl font-semibold">Solicitar adoção de {animalNome}</h2>
      <p className="text-sm text-gray-600">
        Suas respostas serão enviadas à organização responsável, que entrará em contato para os próximos passos.
      </p>
      {erro && <Alert type="error">{erro}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field id="ad-telefone" label="Telefone / WhatsApp" error={errors.telefone?.message}>
          <Input id="ad-telefone" type="tel" autoComplete="tel" placeholder="(51) 99999-9999" invalid={!!errors.telefone} {...register('telefone')} />
        </Field>
        <Field id="ad-cidade" label="Cidade onde mora" error={errors.cidade?.message}>
          <Select id="ad-cidade" invalid={!!errors.cidade} {...register('cidade')}>
            <option value="">Selecione</option>
            {CIDADES.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="Outra">Outra</option>
          </Select>
        </Field>
        <Field id="ad-moradia" label="Tipo de moradia" error={errors.moradia?.message}>
          <Select id="ad-moradia" invalid={!!errors.moradia} defaultValue="" {...register('moradia')}>
            <option value="" disabled>Selecione</option>
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="outro">Outro</option>
          </Select>
        </Field>
        <Field id="ad-espaco" label="Possui pátio ou espaço externo?" error={errors.espaco_externo?.message}>
          <Select id="ad-espaco" invalid={!!errors.espaco_externo} defaultValue="" {...register('espaco_externo')}>
            <option value="" disabled>Selecione</option>
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </Select>
        </Field>
      </div>

      <Field id="ad-outros" label="Tem outros animais? Quais? (opcional)" error={errors.outros_animais?.message}>
        <Input id="ad-outros" placeholder="Ex.: 1 gato castrado de 3 anos" {...register('outros_animais')} />
      </Field>

      <Field id="ad-motivo" label={`Por que você quer adotar ${animalNome}?`} error={errors.motivo?.message}>
        <Textarea id="ad-motivo" rows={4} invalid={!!errors.motivo} {...register('motivo')} />
      </Field>

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" className="mt-0.5 w-4 h-4 accent-purple-600" {...register('concordancia_familia')} />
          Todas as pessoas que moram comigo concordam com a adoção.
        </label>
        {errors.concordancia_familia && <p className="text-sm text-red-600" role="alert">{errors.concordancia_familia.message}</p>}
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input type="checkbox" className="mt-0.5 w-4 h-4 accent-purple-600" {...register('ciente_responsabilidade')} />
          Estou ciente de que adotar envolve cuidados com alimentação, saúde, vacinas e castração por toda a vida do animal.
        </label>
        {errors.ciente_responsabilidade && <p className="text-sm text-red-600" role="alert">{errors.ciente_responsabilidade.message}</p>}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button type="submit" loading={isSubmitting}>Enviar solicitação</Button>
        <Button type="button" variant="secondary" onClick={onCancelar}>Cancelar</Button>
      </div>
    </form>
  );
}
