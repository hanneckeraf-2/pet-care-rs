-- Fase 2: permite que o usuário exclua a própria conta.
-- O front-end não pode apagar registros de auth.users, então expomos uma função
-- security definer que remove apenas a conta de quem a chama. O "on delete cascade"
-- de public.usuario remove perfil, solicitações, inscrições, fotos e notificações.
create or replace function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
