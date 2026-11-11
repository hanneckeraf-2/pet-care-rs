-- Fase 12: preferência de receber as notificações também por e-mail.
-- O envio é feito pela Edge Function "enviar-email-notificacao", acionada por um
-- Database Webhook (INSERT em public.notificacao) configurado no painel do Supabase.
alter table public.usuario add column notificar_email boolean not null default true;
