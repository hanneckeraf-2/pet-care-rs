-- Fase 7: notificações geradas por triggers
-- As funções são security definer (inserem notificações para outros usuários),
-- e as auxiliares não podem ser chamadas diretamente pelos clientes.

create or replace function public.notificar(p_usuario uuid, p_tipo text, p_mensagem text, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notificacao (id_usuario, tipo, mensagem, link)
  select p_usuario, p_tipo, p_mensagem, p_link
  where p_usuario is not null;
$$;

create or replace function public.notificar_admins_org(p_org bigint, p_tipo text, p_mensagem text, p_link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notificacao (id_usuario, tipo, mensagem, link)
  select u.id, p_tipo, p_mensagem, p_link
  from public.usuario u
  where u.id_organizacao = p_org and u.tipo_usuario = 'admin_org';
$$;

revoke execute on function public.notificar(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.notificar_admins_org(bigint, text, text, text) from public, anon, authenticated;

create or replace function public.nome_exibicao(p_usuario uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(nome, ''), split_part(email, '@', 1), 'Um usuário') from public.usuario where id = p_usuario;
$$;

revoke execute on function public.nome_exibicao(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Adoção: nova solicitação -> organização; decisão -> solicitante
-- ---------------------------------------------------------------------
create or replace function public.tg_notificar_adocao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_animal record;
begin
  select id, nome, id_organizacao into v_animal from public.animal where id = new.id_animal;

  if tg_op = 'INSERT' then
    perform public.notificar_admins_org(
      v_animal.id_organizacao, 'adocao_nova',
      public.nome_exibicao(new.id_usuario) || ' quer adotar ' || v_animal.nome || '.',
      '/admin/adocoes'
    );
  elsif new.status is distinct from old.status and new.status in ('aprovada', 'rejeitada') then
    perform public.notificar(
      new.id_usuario, 'adocao_' || new.status::text,
      case when new.status = 'aprovada'
        then 'Sua solicitação para adotar ' || v_animal.nome || ' foi aprovada! A organização entrará em contato.'
        else 'Sua solicitação para adotar ' || v_animal.nome || ' não foi aprovada.'
      end,
      '/perfil'
    );
  end if;
  return new;
end;
$$;

create trigger adocao_notificar after insert or update of status on public.adocao
  for each row execute function public.tg_notificar_adocao();

-- ---------------------------------------------------------------------
-- Voluntariado: nova inscrição -> organização; decisão -> voluntário
-- ---------------------------------------------------------------------
create or replace function public.tg_notificar_inscricao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_vaga record;
begin
  select id, titulo, id_organizacao into v_vaga from public.vaga_voluntariado where id = new.id_vaga;

  if tg_op = 'INSERT' then
    perform public.notificar_admins_org(
      v_vaga.id_organizacao, 'inscricao_nova',
      public.nome_exibicao(new.id_usuario) || ' se inscreveu na vaga "' || v_vaga.titulo || '".',
      '/admin/voluntariado'
    );
  elsif new.status is distinct from old.status and new.status in ('aprovada', 'rejeitada') then
    perform public.notificar(
      new.id_usuario, 'inscricao_' || new.status::text,
      case when new.status = 'aprovada'
        then 'Sua inscrição na vaga "' || v_vaga.titulo || '" foi aprovada! A organização entrará em contato.'
        else 'Sua inscrição na vaga "' || v_vaga.titulo || '" não foi aprovada desta vez.'
      end,
      '/perfil'
    );
  end if;
  return new;
end;
$$;

create trigger inscricao_notificar after insert or update of status on public.inscricao_voluntariado
  for each row execute function public.tg_notificar_inscricao();

-- ---------------------------------------------------------------------
-- Mensagem sobre animal desaparecido -> tutor (ou admins da organização)
-- ---------------------------------------------------------------------
create or replace function public.tg_notificar_mensagem_animal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_animal record;
  v_texto  text;
begin
  select id, nome, id_usuario, id_organizacao into v_animal from public.animal where id = new.id_animal;
  v_texto := new.nome_remetente || ' enviou informações sobre ' || v_animal.nome || '.';

  if v_animal.id_organizacao is not null then
    perform public.notificar_admins_org(v_animal.id_organizacao, 'mensagem_animal', v_texto, '/desaparecidos/' || v_animal.id);
  else
    perform public.notificar(v_animal.id_usuario, 'mensagem_animal', v_texto, '/desaparecidos/' || v_animal.id);
  end if;
  return new;
end;
$$;

-- AFTER INSERT: o nome_remetente já foi preenchido pelo trigger BEFORE da Fase 4.
create trigger mensagem_animal_notificar after insert on public.mensagem_animal
  for each row execute function public.tg_notificar_mensagem_animal();

-- ---------------------------------------------------------------------
-- Novo animal na cidade -> usuários com alertas ativos
-- ---------------------------------------------------------------------
create or replace function public.tg_alertar_cidade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_texto text;
  v_link  text;
begin
  if new.status not in ('disponivel', 'perdido', 'encontrado', 'resgatado') then
    return new;
  end if;

  v_texto := case new.status
    when 'disponivel' then 'Novo animal para adoção em ' || new.cidade || ': ' || new.nome || '.'
    when 'perdido'    then 'Animal perdido em ' || new.cidade || ': ' || new.nome || '. Você viu?'
    else                   'Animal encontrado em ' || new.cidade || '. Conhece a família?'
  end;
  v_link := case when new.status = 'disponivel' then '/animais/' else '/desaparecidos/' end || new.id;

  insert into public.notificacao (id_usuario, tipo, mensagem, link)
  select u.id, 'alerta_cidade', v_texto, v_link
  from public.usuario u
  where u.alertas_ativos
    and u.cidade = new.cidade
    and u.id is distinct from new.id_usuario
    and u.id is distinct from auth.uid()
    and (new.id_organizacao is null or u.id_organizacao is distinct from new.id_organizacao);
  return new;
end;
$$;

create trigger animal_alertar_cidade after insert on public.animal
  for each row execute function public.tg_alertar_cidade();

-- ---------------------------------------------------------------------
-- Realtime: o sino do cabeçalho recebe as notificações na hora
-- (o Realtime respeita as políticas RLS de notificacao)
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table public.notificacao;
