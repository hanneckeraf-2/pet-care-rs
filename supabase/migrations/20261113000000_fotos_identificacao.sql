-- Fotos de identificação de usuários e organizações (Diagrama ER da Etapa II:
-- "cada usuário ou organização poderão ter fotos de identificação").
--
--   * foto.tipo: 'perfil' (usuário), 'logo' e 'capa' (organização); nulo para fotos de animais
--   * no máximo uma foto de cada tipo por dono
--   * organizacao.logo_url: novo campo de exibição do logo
--   * usuario.foto_url, organizacao.foto_url (capa) e organizacao.logo_url passam a ser
--     mantidos por trigger a partir da tabela foto. O cliente só insere, troca ou remove
--     a linha em foto, e as regras de acesso (RLS) de foto já garantem que cada um só
--     mexe nas próprias fotos ou nas da sua organização.

alter table public.organizacao add column logo_url text;

alter table public.foto add column tipo text;
-- (case em vez de and/or: um resultado nulo faria o check passar)
alter table public.foto add constraint foto_tipo_valido check (
  case
    when tipo is null then id_animal is not null
    when tipo = 'perfil' then id_usuario is not null
    when tipo in ('logo', 'capa') then id_organizacao is not null
    else false
  end
);

create unique index foto_perfil_unica on public.foto (id_usuario) where tipo = 'perfil';
create unique index foto_organizacao_unica on public.foto (id_organizacao, tipo) where tipo in ('logo', 'capa');

-- Capas já enviadas antes desta migration passam a constar na tabela foto
insert into public.foto (id_organizacao, url, storage_path, tipo)
select o.id, o.foto_url, substring(o.foto_url from '/storage/v1/object/public/fotos/(.+)$'), 'capa'
from public.organizacao o
where o.foto_url is not null;

create or replace function public.sincronizar_foto_identificacao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  r     public.foto;
  v_url text;
begin
  if tg_op = 'DELETE' then
    r := old;
    v_url := null;
  else
    r := new;
    v_url := new.url;
  end if;

  if r.tipo = 'perfil' then
    update public.usuario set foto_url = v_url where id = r.id_usuario;
  elsif r.tipo = 'capa' then
    update public.organizacao set foto_url = v_url where id = r.id_organizacao;
  elsif r.tipo = 'logo' then
    update public.organizacao set logo_url = v_url where id = r.id_organizacao;
  end if;
  return null;
end;
$$;

create trigger foto_sincroniza_identificacao
  after insert or update of url or delete on public.foto
  for each row execute function public.sincronizar_foto_identificacao();

-- O tipo de uma foto não muda depois de criada (troca-se a url, não o tipo)
create or replace function public.bloquear_troca_tipo_foto()
returns trigger
language plpgsql
as $$
begin
  if new.tipo is distinct from old.tipo
     or new.id_usuario is distinct from old.id_usuario
     or new.id_organizacao is distinct from old.id_organizacao
     or new.id_animal is distinct from old.id_animal then
    raise exception 'Não é permitido alterar o dono ou o tipo da foto';
  end if;
  return new;
end;
$$;

create trigger foto_dono_fixo before update on public.foto
  for each row execute function public.bloquear_troca_tipo_foto();
