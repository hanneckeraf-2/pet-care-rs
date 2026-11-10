import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { useAuth } from '../../contexts/AuthContext';
import { AuthCard, Divisor, GoogleButton } from '../../components/AuthCard';
import { Alert, Button, Field, Input } from '../../components/ui';

const schema = z.object({
  email: z.email({ error: 'Informe um e-mail válido.' }),
  senha: z.string().min(1, { error: 'Informe sua senha.' }),
});
type FormData = z.infer<typeof schema>;

export default function Entrar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { from?: string } | null)?.from ?? '/';
  const [erro, setErro] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user) return <Navigate to={destino} replace />;

  async function onSubmit(dados: FormData) {
    setErro(null);
    const { error } = await supabase.auth.signInWithPassword({ email: dados.email, password: dados.senha });
    if (error) return setErro(traduzirErro(error));
    navigate(destino, { replace: true });
  }

  return (
    <AuthCard title="Entrar" subtitle="Acesse sua conta no Pet Care RS">
      {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}

      <GoogleButton redirectPath={destino} onError={setErro} />
      <Divisor />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field id="email" label="E-mail" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field id="senha" label="Senha" error={errors.senha?.message}>
          <Input id="senha" type="password" autoComplete="current-password" invalid={!!errors.senha} {...register('senha')} />
        </Field>
        <div className="text-right">
          <Link to="/recuperar-senha" className="text-sm text-purple-700 hover:underline">Esqueci minha senha</Link>
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">Entrar</Button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" state={location.state} className="text-purple-700 font-semibold hover:underline">Cadastre-se</Link>
      </p>
    </AuthCard>
  );
}
