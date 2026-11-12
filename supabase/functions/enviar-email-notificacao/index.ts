// Edge Function (Deno): envia por e-mail cada notificação criada no banco.
//
// Acionada por um Database Webhook do Supabase (INSERT em public.notificacao).
// Respeita a preferência usuario.notificar_email e envia pela API HTTP do Brevo.
//
// Secrets necessários (npx supabase secrets set ...):
//   BREVO_API_KEY    chave da API do Brevo
//   EMAIL_REMETENTE  e-mail remetente verificado no Brevo
//   SITE_URL         endereço público do site (ex.: https://pet-care-rs.vercel.app)
//   WEBHOOK_SECRET   segredo enviado pelo webhook no header x-webhook-secret
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são fornecidos automaticamente pelo Supabase.

import { createClient } from 'npm:@supabase/supabase-js@2';

type Notificacao = {
  id: number;
  id_usuario: string;
  tipo: string;
  mensagem: string;
  link: string | null;
};

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Notificacao | null;
};

const ASSUNTOS: Record<string, string> = {
  adocao_nova: 'Nova solicitação de adoção',
  adocao_aprovada: 'Sua solicitação de adoção foi aprovada!',
  adocao_rejeitada: 'Atualização sobre sua solicitação de adoção',
  inscricao_nova: 'Nova inscrição de voluntário',
  inscricao_aprovada: 'Sua inscrição de voluntariado foi aprovada!',
  inscricao_rejeitada: 'Atualização sobre sua inscrição de voluntariado',
  mensagem_animal: 'Novas informações sobre um animal desaparecido',
  alerta_cidade: 'Novo animal na sua cidade',
  lar_temporario_novo: 'Novo pedido de lar temporário',
  lar_temporario_aprovada: 'Seu pedido de lar temporário foi aprovado!',
  lar_temporario_rejeitada: 'Atualização sobre seu pedido de lar temporário',
  pergunta_animal: 'Nova pergunta sobre um animal',
};

function env(nome: string): string {
  const valor = Deno.env.get(nome);
  if (!valor) throw new Error(`Variável de ambiente ausente: ${nome}`);
  return valor;
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Comparação em tempo constante para o segredo do webhook. */
function segredoValido(recebido: string | null, esperado: string): boolean {
  if (!recebido || recebido.length !== esperado.length) return false;
  let diferenca = 0;
  for (let i = 0; i < esperado.length; i++) diferenca |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diferenca === 0;
}

function montarHtml(nome: string, mensagem: string, url: string, urlPerfil: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:24px;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;color:#111827">
    <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
      <tr><td>
        <p style="margin:0 0 8px;color:#7c3aed;font-weight:bold;font-size:18px">Pet Care RS</p>
        <p style="margin:0 0 16px">Olá${nome ? `, ${escaparHtml(nome)}` : ''}!</p>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.5">${escaparHtml(mensagem)}</p>
        <a href="${url}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:bold">Abrir no Pet Care RS</a>
        <p style="margin:32px 0 0;font-size:12px;color:#6b7280">
          Você recebe este e-mail porque as notificações por e-mail estão ativas na sua conta.
          Para desativá-las, acesse <a href="${urlPerfil}" style="color:#7c3aed">Meu perfil</a>.
        </p>
      </td></tr>
    </table>
  </body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Método não permitido', { status: 405 });

  if (!segredoValido(req.headers.get('x-webhook-secret'), env('WEBHOOK_SECRET'))) {
    return new Response('Não autorizado', { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('JSON inválido', { status: 400 });
  }

  const n = payload.record;
  if (payload.type !== 'INSERT' || payload.table !== 'notificacao' || !n) {
    return Response.json({ ignorado: true });
  }

  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
  const { data: usuario, error } = await admin
    .from('usuario')
    .select('email, nome, notificar_email')
    .eq('id', n.id_usuario)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar usuário', error);
    return new Response('Erro ao buscar usuário', { status: 500 });
  }
  if (!usuario || !usuario.notificar_email) {
    return Response.json({ enviado: false, motivo: 'preferência desativada ou usuário inexistente' });
  }

  const siteUrl = env('SITE_URL').replace(/\/$/, '');
  // só aceita caminhos internos, para o e-mail nunca apontar para outro site
  const url = n.link && n.link.startsWith('/') && !n.link.startsWith('//') ? siteUrl + n.link : siteUrl;
  const assunto = ASSUNTOS[n.tipo] ?? 'Nova notificação';

  const resposta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env('BREVO_API_KEY'),
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Pet Care RS', email: env('EMAIL_REMETENTE') },
      to: [{ email: usuario.email, ...(usuario.nome ? { name: usuario.nome } : {}) }],
      subject: assunto,
      htmlContent: montarHtml(usuario.nome, n.mensagem, url, `${siteUrl}/perfil`),
      textContent: `${n.mensagem}\n\nAbrir no Pet Care RS: ${url}\n\nPara desativar estes e-mails, acesse ${siteUrl}/perfil`,
    }),
  });

  if (!resposta.ok) {
    const detalhe = await resposta.text();
    console.error('Falha no envio pelo Brevo', resposta.status, detalhe);
    return new Response('Falha no envio do e-mail', { status: 502 });
  }

  return Response.json({ enviado: true });
});
