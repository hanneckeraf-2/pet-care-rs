-- Fase 8: revisão de segurança
-- Um admin de organização podia preencher animal.id_usuario com o id de qualquer
-- pessoa, que passaria a "gerenciar" o animal (fotos e mensagens) via
-- pode_gerenciar_animal(). Agora, em animais de organização, id_usuario só pode
-- ser nulo ou um administrador da própria organização.

create or replace function public.usuario_admin_da_org(p_usuario uuid, p_org bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuario
    where id = p_usuario and id_organizacao = p_org and tipo_usuario = 'admin_org'
  );
$$;

drop policy "animal: organização cadastra" on public.animal;
create policy "animal: organização cadastra" on public.animal
  for insert to authenticated with check (
    public.is_admin_org(id_organizacao)
    and (id_usuario is null or public.usuario_admin_da_org(id_usuario, id_organizacao))
  );

drop policy "animal: organização atualiza" on public.animal;
create policy "animal: organização atualiza" on public.animal
  for update to authenticated
  using (public.is_admin_org(id_organizacao))
  with check (
    public.is_admin_org(id_organizacao)
    and (id_usuario is null or public.usuario_admin_da_org(id_usuario, id_organizacao))
  );
