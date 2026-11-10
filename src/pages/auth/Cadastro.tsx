import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MailCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { useAuth } from '../../contexts/AuthContext';
import { AuthCard, Divisor, GoogleButton } from '../../components/AuthCard';
import { Alert, Button, Field, Input } from '../../components/ui';

const schema = z
  .object({
    nome: z.string().trim().min(2, { error: 'Informe seu nome.' }).max(120),
    email: z.email({ error: 'Informe um e-mail válido.' }),
    senha: z.string().min(8, { error: 'A senha deve ter pelo menos 8 caracteres.' }),
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, { path: ['confirmar'], error: 'As senhas não conferem.' });
type FormData = z.infer<typeof schema>;

export default function Cadastro() {
  const { user } = useAuth();
  const location = useLocation();
  const destino = (location.state as { from?: string } | null)?.from ?? '/';
  const [erro, setErro] = useState<string | null>(null);
  const [emailEnviado, setEmailEnviado] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  if (user) return <Navigate to={destino} replace />;

  async function onSubmit(dados: FormData) {
    setErro(null);
    const { data, error } = await supabase.auth.signUp({
      email: dados.email,
      password: dados.senha,
      options: {
        data: { nome: dados.nome },
        emailRedirectTo: window.location.origin + destino,
      },
    });
    if (error) return setErro(traduzirErro(error));
    // Com confirmação de e-mail ativa, o Supabase não informa se o e-mail já existe:
    // devolve um usuário sem identidades.
    if (data.user && data.user.identities?.length === 0) {
      return setErro('Já existe uma conta com este e-mail. Tente entrar ou recuperar a senha.');
    }
    if (!data.session) setEmailEnviado(dados.email);
    // Se a confirmação de e-mail estiver desativada, a sessão já existe e o <Navigate> acima redireciona.
  }

  if (emailEnviado) {
    return (
      <AuthCard title="Confirme seu e-mail">
        <div className="text-center">
          <MailCheck className="w-12 h-12 text-purple-600 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-700">
            Enviamos um link de confirmação para <strong>{emailEnviado}</strong>. Clique nele para ativar sua conta.
          </p>
          <p className="text-sm text-gray-500 mt-3">Não recebeu? Verifique a pasta de spam.</p>
          <Link to="/entrar" className="inline-block mt-6 text-purple-700 font-semibold hover:underline">Ir para o login</Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Criar conta" subtitle="Adote, ajude e encontre animais no Vale do Sinos">
      {erro && <div className="mb-4"><Alert type="error">{erro}</Alert></div>}

      <GoogleButton redirectPath={destino} onError={setErro} />
      <Divisor />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field id="nome" label="Nome completo" error={errors.nome?.message}>
          <Input id="nome" autoComplete="name" invalid={!!errors.nome} {...register('nome')} />
        </Field>
        <Field id="email" label="E-mail" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
        </Field>
        <Field id="senha" label="Senha" hint="Mínimo de 8 caracteres." error={errors.senha?.message}>
          <Input id="senha" type="password" autoComplete="new-password" invalid={!!errors.senha} {...register('senha')} />
        </Field>
        <Field id="confirmar" label="Confirmar senha" error={errors.confirmar?.message}>
          <Input id="confirmar" type="password" autoComplete="new-password" invalid={!!errors.confirmar} {...register('confirmar')} />
        </Field>
        <Button type="submit" loading={isSubmitting} className="w-full">Criar conta</Button>
      </form>

      <p className="text-center text-sm text-gray-600 mt-6">
        Já tem conta?{' '}
        <Link to="/entrar" state={location.state} className="text-purple-700 font-semibold hover:underline">Entrar</Link>
      </p>
    </AuthCard>
  );
}
