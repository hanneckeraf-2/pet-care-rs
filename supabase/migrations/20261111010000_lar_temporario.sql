-- Lar temporário e perguntas sobre animais das organizações
--   * animal.aceita_lar_temporario: a organização indica que o animal precisa de lar temporário
--   * adocao.tipo: a mesma tabela guarda pedidos de adoção e de lar temporário
--     (mesmo fluxo de análise, histórico, painel e notificações)
--   * mensagem_animal passa a aceitar perguntas ("Quero Mais Informações")
--     sobre animais das organizações, não só sobre desaparecidos

-- ---------------------------------------------------------------------
-- Estrutura
-- ---------------------------------------------------------------------
alter table public.animal add column aceita_lar_temporario boolean not null default false;

create type public.tipo_solicitacao as enum ('adocao', 'lar_temporario');
alter table public.adocao add column tipo public.tipo_solicitacao not null default 'adocao';

-- uma solicitação em análise por pessoa, animal e TIPO
drop index public.adocao_unica_em_analise;
create unique index adocao_unica_em_analise on public.adocao (id_usuario, id_animal, tipo) where status = 'em_analise';

-- ---------------------------------------------------------------------
-- Quem pode solicitar
-- ---------------------------------------------------------------------
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
          (tipo = 'adocao' and a.status in ('disponivel', 'em_processo'))
          or (tipo = 'lar_temporario' and a.aceita_lar_temporario and a.status in ('disponivel', 'em_processo', 'resgatado'))
        )
    )
  );

-- ---------------------------------------------------------------------
-- Decisão: lar temporário aprovado não torna o animal "adotado"
-- nem recusa os demais pedidos
-- ---------------------------------------------------------------------
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
    update public.animal set status = 'adotado' where id = v_animal;

    update public.adocao
       set status = 'rejeitada',
           descricao = 'O animal foi adotado por outra família. Obrigado pelo interesse!'
     where id_animal = v_animal and status = 'em_analise' and id <> p_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Perguntas sobre animais das organizações
-- ---------------------------------------------------------------------
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
          or (a.id_organizacao is not null and a.status in ('disponivel', 'em_processo'))
        )
    )
  );

-- ---------------------------------------------------------------------
-- Notificações conforme o tipo
-- ---------------------------------------------------------------------
create or replace function public.tg_notificar_adocao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_animal record;
  v_lt     boolean := new.tipo = 'lar_temporario';
begin
  select id, nome, id_organizacao into v_animal from public.animal where id = new.id_animal;

  if tg_op = 'INSERT' then
    perform public.notificar_admins_org(
      v_animal.id_organizacao,
      case when v_lt then 'lar_temporario_novo' else 'adocao_nova' end,
      public.nome_exibicao(new.id_usuario)
        || case when v_lt then ' quer ser lar temporário de ' else ' quer adotar ' end
        || v_animal.nome || '.',
      '/admin/adocoes'
    );
  elsif new.status is distinct from old.status and new.status in ('aprovada', 'rejeitada') then
    perform public.notificar(
      new.id_usuario,
      case when v_lt then 'lar_temporario_' else 'adocao_' end || new.status::text,
      case
        when v_lt and new.status = 'aprovada'
          then 'Sua solicitação para ser lar temporário de ' || v_animal.nome || ' foi aprovada! A organização entrará em contato.'
        when v_lt
          then 'Sua solicitação para ser lar temporário de ' || v_animal.nome || ' não foi aprovada desta vez.'
        when new.status = 'aprovada'
          then 'Sua solicitação para adotar ' || v_animal.nome || ' foi aprovada! A organização entrará em contato.'
        else 'Sua solicitação para adotar ' || v_animal.nome || ' não foi aprovada.'
      end,
      '/perfil'
    );
  end if;
  return new;
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

  if v_animal.id_organizacao is not null and v_animal.status in ('disponivel', 'em_processo') then
    -- pergunta sobre um animal para adoção
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
