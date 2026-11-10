import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { traduzirErro } from '../../lib/erros';
import { novaSenhaSchema, type NovaSenhaData } from '../../lib/schemas';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Button, Card, Field, Input } from '../../components/ui';

export default function Configuracoes() {
  const { user, sair } = useAuth();
  const navigate = useNavigate();
  const [msgSenha, setMsgSenha] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [confirmacao, setConfirmacao] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<NovaSenhaData>({
    resolver: zodResolver(novaSenhaSchema),
  });

  const loginSocial = user?.app_metadata.provider && user.app_metadata.provider !== 'email';

  async function trocarSenha({ senha }: NovaSenhaData) {
    setMsgSenha(null);
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) return setMsgSenha({ type: 'error', text: traduzirErro(error) });
    reset({ senha: '', confirmar: '' });
    setMsgSenha({ type: 'success', text: 'Senha alterada com sucesso.' });
  }

  async function excluirConta() {
    setErroExclusao(null);
    setExcluindo(true);
    const { error } = await supabase.rpc('excluir_minha_conta');
    if (error) {
      setExcluindo(false);
      return setErroExclusao(traduzirErro(error));
    }
    await sair();
    navigate('/', { replace: true });
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <Link to="/perfil" className="inline-flex items-center gap-1 text-purple-700 hover:underline mb-4">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar ao perfil
      </Link>
      <h1 className="text-3xl font-bold mb-8">Configurações da conta</h1>

      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-1">Alterar senha</h2>
        {loginSocial && (
          <p className="text-sm text-gray-600 mb-4">
            Você entra com sua conta {user?.app_metadata.provider === 'google' ? 'Google' : 'social'}. Definir uma senha permite entrar também com e-mail e senha.
          </p>
        )}
        <form onSubmit={handleSubmit(trocarSenha)} className="space-y-4 mt-4" noValidate>
          {msgSenha && <Alert type={msgSenha.type}>{msgSenha.text}</Alert>}
          <Field id="senha" label="Nova senha" hint="Mínimo de 8 caracteres." error={errors.senha?.message}>
            <Input id="senha" type="password" autoComplete="new-password" invalid={!!errors.senha} {...register('senha')} />
          </Field>
          <Field id="confirmar" label="Confirmar nova senha" error={errors.confirmar?.message}>
            <Input id="confirmar" type="password" autoComplete="new-password" invalid={!!errors.confirmar} {...register('confirmar')} />
          </Field>
          <Button type="submit" loading={isSubmitting}>Alterar senha</Button>
        </form>
      </Card>

      <Card className="border border-red-200">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Excluir conta</h2>
        <p className="text-gray-600 mb-4">
          Esta ação é permanente. Seu perfil, suas solicitações de adoção, inscrições de voluntariado e registros de animais desaparecidos serão apagados.
        </p>
        {erroExclusao && <div className="mb-4"><Alert type="error">{erroExclusao}</Alert></div>}
        <Field id="confirmacao" label='Digite "EXCLUIR" para confirmar'>
          <Input id="confirmacao" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" />
        </Field>
        <Button variant="danger" className="mt-4" disabled={confirmacao !== 'EXCLUIR'} loading={excluindo} onClick={excluirConta}>
          Excluir minha conta
        </Button>
      </Card>
    </div>
  );
}
