-- Fase 4 (parte 2): animais desaparecidos

-- O tutor pode marcar o animal como "reunido" (voltou para casa)
drop policy "animal: tutor atualiza" on public.animal;
create policy "animal: tutor atualiza" on public.animal
  for update to authenticated
  using (id_usuario = auth.uid() and id_organizacao is null)
  with check (
    id_usuario = auth.uid() and id_organizacao is null
    and status in ('perdido', 'encontrado', 'resgatado', 'reunido')
  );

-- Nome do remetente gravado pelo servidor (o tutor não tem acesso ao perfil de quem escreveu)
alter table public.mensagem_animal add column nome_remetente text not null default '';

create or replace function public.preencher_remetente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select coalesce(nullif(u.nome, ''), split_part(u.email, '@', 1))
    into new.nome_remetente
  from public.usuario u
  where u.id = new.id_remetente;
  return new;
end;
$$;

create trigger mensagem_animal_remetente before insert on public.mensagem_animal
  for each row execute function public.preencher_remetente();

-- Só faz sentido enviar mensagens sobre registros de desaparecidos ativos, e não para si mesmo
drop policy "mensagem_animal: usuário envia" on public.mensagem_animal;
create policy "mensagem_animal: usuário envia" on public.mensagem_animal
  for insert to authenticated with check (
    id_remetente = auth.uid()
    and exists (
      select 1 from public.animal a
      where a.id = id_animal
        and a.status in ('perdido', 'encontrado', 'resgatado')
        and a.id_usuario is distinct from auth.uid()
    )
  );

-- Tutor pode apagar mensagens recebidas
create policy "mensagem_animal: responsável apaga" on public.mensagem_animal
  for delete to authenticated using (public.pode_gerenciar_animal(id_animal));
