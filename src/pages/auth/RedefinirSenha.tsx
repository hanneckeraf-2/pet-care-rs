import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { novaSenhaSchema, type NovaSenhaData as FormData } from '../../lib/schemas';
import { traduzirErro } from '../../lib/erros';
import { useAuth } from '../../contexts/AuthContext';
import { AuthCard } from '../../components/AuthCard';
import { Alert, Button, Field, Input } from '../../components/ui';
import Spinner from '../../components/Spinner';

/** Página aberta pelo link do e-mail de recuperação (o Supabase já cria a sessão de recuperação). */
export default function RedefinirSenha() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [erro, setErro] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(novaSenhaSchema) });

  if (loading) return <Spinner />;

  if (!user) {
    return (
      <AuthCard title="Link inválido ou expirado">
        <p className="text-center text-gray-600">
          Solicite um novo link de recuperação.{' '}
          <Link to="/recuperar-senha" className="text-purple-700 font-semibold hover:underline">Recuperar senha</Link>
        </p>
      </AuthCard>
    );
  }

  async function onSubmit({ senha }: FormData) {
    setErro(null);
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) return setErro(traduzirErro(error));
    navigate('/perfil', { replace: true, state: { mensagem: 'Senha alterada com sucesso.' } });
  }

  return (
    <AuthCard title="Nova senha" subtitle="Escolha uma nova senha para sua conta.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {erro && <Alert type="error">{erro}</Alert>}
        <Field id="senha" label="Nova senha" hint="Mínimo de 8 caracteres." error={errors.senha?.message}>
          <Input id="senha" type="password" autoComplete="new-password" invalid={!!errors.senha} {...register('senha')} />
        </Field>
        <Field id="confirmar" label="Confirmar nova senha" error={errors.confirmar?.message}>
          <Input id="confirmar" type="password" autoComplete="new-password" invalid={!!errors.confirmar} {...register('confirmar')} />
        </Field>
        <Button type="submit" loading={isSubmitting} className="w-full">Salvar nova senha</Button>
      </form>
    </AuthCard>
  );
}
