import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { AuthCard } from '../../components/AuthCard';
import { Alert, Button, Field, Input } from '../../components/ui';

const schema = z.object({ email: z.email({ error: 'Informe um e-mail válido.' }) });
type FormData = z.infer<typeof schema>;

export default function RecuperarSenha() {
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: FormData) {
    setErro(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    if (error) return setErro(traduzirErro(error));
    setEnviado(true);
  }

  return (
    <AuthCard title="Recuperar senha" subtitle="Enviaremos um link para você criar uma nova senha.">
      {enviado ? (
        <Alert type="success">
          Se existir uma conta com esse e-mail, você receberá um link de redefinição em instantes. Verifique também o spam.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {erro && <Alert type="error">{erro}</Alert>}
          <Field id="email" label="E-mail" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
          </Field>
          <Button type="submit" loading={isSubmitting} className="w-full">Enviar link</Button>
        </form>
      )}
      <p className="text-center text-sm mt-6">
        <Link to="/entrar" className="text-purple-700 font-semibold hover:underline">Voltar para o login</Link>
      </p>
    </AuthCard>
  );
}
