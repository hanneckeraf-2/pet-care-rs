-- Regras para a situação "em_lar_temporario"
--   * o animal continua adotável: aceita pedidos de adoção e perguntas
--   * não aceita novos pedidos de lar temporário (já está acolhido)
--   * aprovar um lar temporário coloca o animal nessa situação

drop policy "adocao: usuário solicita" on public.adocao;
create policy "adocao: usuário solicita" on public.adocao
  for insert to authenticated with check (
    id_usuario = auth.uid()
    and status = 'em_analise'
    and exists (
      select 1 from public.animal a
      where a.id = id_animal
        and a.id_organizacao is not null
        and (
          (tipo = 'adocao' and a.status in ('disponivel', 'em_processo', 'em_lar_temporario'))
          or (tipo = 'lar_temporario' and a.aceita_lar_temporario and a.status in ('disponivel', 'em_processo', 'resgatado'))
        )
    )
  );

drop policy "mensagem_animal: usuário envia" on public.mensagem_animal;
create policy "mensagem_animal: usuário envia" on public.mensagem_animal
  for insert to authenticated with check (
    id_remetente = auth.uid()
    and exists (
      select 1 from public.animal a
      where a.id = id_animal
        and a.id_usuario is distinct from auth.uid()
        and (
          a.status in ('perdido', 'encontrado', 'resgatado')
          or (a.id_organizacao is not null and a.status in ('disponivel', 'em_processo', 'em_lar_temporario'))
        )
    )
  );

create or replace function public.decidir_adocao(p_id bigint, p_aprovar boolean, p_observacao text default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_animal bigint;
  v_org    bigint;
  v_tipo   public.tipo_solicitacao;
begin
  select ad.id_animal, an.id_organizacao, ad.tipo
    into v_animal, v_org, v_tipo
  from public.adocao ad
  join public.animal an on an.id = ad.id_animal
  where ad.id = p_id;

  if v_animal is null or not public.is_admin_org(v_org) then
    raise exception 'Solicitação não encontrada ou sem permissão';
  end if;

  update public.adocao
     set status = case when p_aprovar then 'aprovada'::public.status_adocao else 'rejeitada'::public.status_adocao end,
         descricao = nullif(trim(p_observacao), '')
   where id = p_id and status = 'em_analise';

  if not found then
    raise exception 'Esta solicitação não está mais em análise';
  end if;

  if p_aprovar and v_tipo = 'adocao' then
    update public.animal set status = 'adotado', aceita_lar_temporario = false where id = v_animal;

    update public.adocao
       set status = 'rejeitada',
           descricao = 'O animal foi adotado por outra família. Obrigado pelo interesse!'
     where id_animal = v_animal and status = 'em_analise' and id <> p_id;
  elsif p_aprovar and v_tipo = 'lar_temporario' then
    -- o animal foi acolhido: não precisa mais de lar temporário
    update public.animal
       set status = case when status = 'disponivel' then 'em_lar_temporario'::public.status_animal else status end,
           aceita_lar_temporario = false
     where id = v_animal;
  end if;
end;
$$;

create or replace function public.tg_notificar_mensagem_animal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_animal record;
begin
  select id, nome, status, id_usuario, id_organizacao into v_animal from public.animal where id = new.id_animal;

  if v_animal.id_organizacao is not null and v_animal.status in ('disponivel', 'em_processo', 'em_lar_temporario') then
    perform public.notificar_admins_org(
      v_animal.id_organizacao, 'pergunta_animal',
      new.nome_remetente || ' fez uma pergunta sobre ' || v_animal.nome || '.',
      '/admin/mensagens'
    );
  elsif v_animal.id_organizacao is not null then
    perform public.notificar_admins_org(
      v_animal.id_organizacao, 'mensagem_animal',
      new.nome_remetente || ' enviou informações sobre ' || v_animal.nome || '.',
      '/desaparecidos/' || v_animal.id
    );
  else
    perform public.notificar(
      v_animal.id_usuario, 'mensagem_animal',
      new.nome_remetente || ' enviou informações sobre ' || v_animal.nome || '.',
      '/desaparecidos/' || v_animal.id
    );
  end if;
  return new;
end;
$$;
