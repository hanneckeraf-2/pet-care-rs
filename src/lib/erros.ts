// Traduz as mensagens de erro mais comuns do Supabase para português.
const traducoes: [RegExp, string][] = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (e o spam).'],
  [/user already registered/i, 'Já existe uma conta com este e-mail.'],
  [/password should be at least/i, 'A senha deve ter pelo menos 6 caracteres.'],
  [/new password should be different/i, 'A nova senha deve ser diferente da atual.'],
  [/rate limit|too many requests|security purposes/i, 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'],
  [/unable to validate email|invalid format/i, 'E-mail inválido.'],
  [/provider is not enabled|unsupported provider/i, 'Este método de login ainda não está habilitado.'],
  [/failed to fetch|network/i, 'Não foi possível conectar ao servidor. Verifique sua internet.'],
  [/duplicate key/i, 'Este registro já existe.'],
  [/row-level security|permission denied/i, 'Você não tem permissão para realizar esta ação.'],
  [/jwt expired|session.*(missing|expired)/i, 'Sua sessão expirou. Entre novamente.'],
];

export function traduzirErro(erro: unknown): string {
  const msg = erro instanceof Error ? erro.message : typeof erro === 'object' && erro && 'message' in erro ? String(erro.message) : String(erro);
  for (const [regex, texto] of traducoes) {
    if (regex.test(msg)) return texto;
  }
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
