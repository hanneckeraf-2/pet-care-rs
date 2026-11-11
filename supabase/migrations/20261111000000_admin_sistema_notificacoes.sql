-- Administradores do sistema também recebem as notificações das organizações
-- (nova adoção, nova inscrição, mensagens sobre animais resgatados).
-- Necessário porque o administrador do sistema gerencia as organizações
-- parceiras enquanto elas não têm administradores próprios.
create or replace function public.notificar_admins_org(p_org bigint, p_tipo text, p_mensagem text, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notificacao (id_usuario, tipo, mensagem, link)
  select u.id, p_tipo, p_mensagem, p_link
  from public.usuario u
  where (u.id_organizacao = p_org and u.tipo_usuario = 'admin_org')
     or u.tipo_usuario = 'admin_sistema';
$$;

revoke execute on function public.notificar_admins_org(bigint, text, text, text) from public, anon, authenticated;
