-- =====================================================================
-- Pet Care RS - Esquema inicial (Fase 1)
-- Baseado no Diagrama ER do Trabalho Final (Atividade Extensionista II),
-- com os ajustes descritos no plano:
--   * Autenticacao  -> auth.users do Supabase (provedores e senhas geridos pelo Supabase)
--   * Voluntariado  -> vaga_voluntariado + inscricao_voluntariado
--   * Foto          -> também pode pertencer a uma organização
--   * Novas tabelas -> notificacao, mensagem_contato, mensagem_animal
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type public.tipo_usuario as enum ('comum', 'admin_org', 'admin_sistema');
create type public.especie as enum ('cachorro', 'gato', 'outro');
create type public.sexo as enum ('macho', 'femea', 'desconhecido');
create type public.porte as enum ('pequeno', 'medio', 'grande');
create type public.status_animal as enum ('disponivel', 'em_processo', 'adotado', 'perdido', 'encontrado', 'resgatado');
create type public.status_adocao as enum ('em_analise', 'aprovada', 'rejeitada', 'cancelada');
create type public.disponibilidade as enum ('dias_uteis', 'finais_de_semana', 'flexivel');
create type public.status_vaga as enum ('aberta', 'encerrada');
create type public.status_inscricao as enum ('pendente', 'aprovada', 'rejeitada', 'cancelada');

-- ---------------------------------------------------------------------
-- Função utilitária: atualiza a coluna atualizado_em
-- ---------------------------------------------------------------------
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Organização (ONGs, abrigos, protetores)
-- ---------------------------------------------------------------------
create table public.organizacao (
  id             bigint generated always as identity primary key,
  nome           text not null check (char_length(nome) between 2 and 120),
  descricao      text,
  endereco       text,
  cidade         text not null,
  telefone       text,
  email          text,
  contatos       jsonb not null default '{}'::jsonb,  -- redes sociais: {"instagram": "...", "facebook": "...", "whatsapp": "..."}
  pix_doacao     text,
  necessidades   text,                                -- pedidos de ajuda material/financeira
  foto_url       text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);

create trigger organizacao_atualizado_em before update on public.organizacao
  for each row execute function public.set_atualizado_em();

-- ---------------------------------------------------------------------
-- Usuário (perfil público ligado a auth.users)
-- ---------------------------------------------------------------------
create table public.usuario (
  id              uuid primary key references auth.users (id) on delete cascade,
  id_organizacao  bigint references public.organizacao (id) on delete set null,
  nome            text not null default '',
  email           text not null,
  telefone        text,
  cidade          text,
  tipo_usuario    public.tipo_usuario not null default 'comum',
  alertas_ativos  boolean not null default false,  -- receber avisos de novos animais na sua cidade
  foto_url        text,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index usuario_id_organizacao_idx on public.usuario (id_organizacao);

create trigger usuario_atualizado_em before update on public.usuario
  for each row execute function public.set_atualizado_em();

-- ---------------------------------------------------------------------
-- Funções auxiliares para as políticas RLS
-- (security definer para evitar recursão nas políticas de public.usuario)
-- ---------------------------------------------------------------------
create or replace function public.is_admin_sistema()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuario
    where id = auth.uid() and tipo_usuario = 'admin_sistema'
  );
$$;

create or replace function public.organizacao_do_usuario()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select id_organizacao from public.usuario
  where id = auth.uid() and tipo_usuario = 'admin_org';
$$;

create or replace function public.is_admin_org(org_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select org_id is not null
     and (org_id = public.organizacao_do_usuario() or public.is_admin_sistema());
$$;

-- Impede que um usuário comum promova a si mesmo a administrador
create or replace function public.proteger_campos_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- auth.uid() nulo = chamada pelo service role / SQL editor: liberado
  if auth.uid() is not null and not public.is_admin_sistema() then
    new.tipo_usuario   := old.tipo_usuario;
    new.id_organizacao := old.id_organizacao;
    new.email          := old.email;
  end if;
  return new;
end;
$$;

create trigger usuario_proteger_campos before update on public.usuario
  for each row execute function public.proteger_campos_usuario();

-- Cria automaticamente o perfil quando alguém se cadastra (e-mail/senha ou Google)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuario (id, email, nome)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Animal (para adoção, perdido, encontrado ou resgatado)
-- ---------------------------------------------------------------------
create table public.animal (
  id                    bigint generated always as identity primary key,
  id_usuario            uuid references public.usuario (id) on delete cascade,      -- tutor (perdidos/encontrados)
  id_organizacao        bigint references public.organizacao (id) on delete cascade, -- organização responsável
  nome                  text not null check (char_length(nome) between 1 and 80),
  especie               public.especie not null,
  raca                  text,
  idade_meses           integer check (idade_meses is null or idade_meses between 0 and 400),
  sexo                  public.sexo not null default 'desconhecido',
  porte                 public.porte,
  status                public.status_animal not null default 'disponivel',
  cidade                text not null,
  local                 text,                       -- bairro / endereço aproximado
  descricao             text,
  data_desaparecimento  date,
  ultimo_local_visto    text,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now(),
  constraint animal_tem_responsavel check (id_usuario is not null or id_organizacao is not null)
);

create index animal_status_idx        on public.animal (status);
create index animal_especie_idx       on public.animal (especie);
create index animal_cidade_idx        on public.animal (cidade);
create index animal_id_organizacao_idx on public.animal (id_organizacao);
create index animal_id_usuario_idx    on public.animal (id_usuario);

create trigger animal_atualizado_em before update on public.animal
  for each row execute function public.set_atualizado_em();

create or replace function public.pode_gerenciar_animal(animal_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.animal a
    where a.id = animal_id
      and (a.id_usuario = auth.uid() or public.is_admin_org(a.id_organizacao))
  );
$$;

-- ---------------------------------------------------------------------
-- Foto (de animal, usuário ou organização)
-- ---------------------------------------------------------------------
create table public.foto (
  id              bigint generated always as identity primary key,
  id_animal       bigint references public.animal (id) on delete cascade,
  id_usuario      uuid references public.usuario (id) on delete cascade,
  id_organizacao  bigint references public.organizacao (id) on delete cascade,
  url             text not null,
  storage_path    text,          -- caminho no bucket "fotos" (nulo para URLs externas)
  descricao       text,
  ordem           integer not null default 0,
  criado_em       timestamptz not null default now(),
  constraint foto_um_dono check (num_nonnulls(id_animal, id_usuario, id_organizacao) = 1)
);

create index foto_id_animal_idx on public.foto (id_animal);

-- ---------------------------------------------------------------------
-- Adoção (solicitações)
-- ---------------------------------------------------------------------
create table public.adocao (
  id                bigint generated always as identity primary key,
  id_usuario        uuid not null references public.usuario (id) on delete cascade,
  id_animal         bigint not null references public.animal (id) on delete cascade,
  status            public.status_adocao not null default 'em_analise',
  dados_formulario  jsonb not null default '{}'::jsonb,
  descricao         text,          -- observações da organização
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

create index adocao_id_animal_idx on public.adocao (id_animal);
create index adocao_id_usuario_idx on public.adocao (id_usuario);
-- um usuário só pode ter uma solicitação em análise por animal
create unique index adocao_unica_em_analise on public.adocao (id_usuario, id_animal) where status = 'em_analise';

create trigger adocao_atualizado_em before update on public.adocao
  for each row execute function public.set_atualizado_em();

-- ---------------------------------------------------------------------
-- Voluntariado: vagas abertas pelas organizações e inscrições dos usuários
-- ---------------------------------------------------------------------
create table public.vaga_voluntariado (
  id               bigint generated always as identity primary key,
  id_organizacao   bigint not null references public.organizacao (id) on delete cascade,
  titulo           text not null,
  atividade        text not null,     -- ex.: veterinária, limpeza, transporte, eventos
  descricao        text,
  disponibilidade  public.disponibilidade not null default 'flexivel',
  status           public.status_vaga not null default 'aberta',
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now()
);

create index vaga_id_organizacao_idx on public.vaga_voluntariado (id_organizacao);

create trigger vaga_atualizado_em before update on public.vaga_voluntariado
  for each row execute function public.set_atualizado_em();

create table public.inscricao_voluntariado (
  id             bigint generated always as identity primary key,
  id_vaga        bigint not null references public.vaga_voluntariado (id) on delete cascade,
  id_usuario     uuid not null references public.usuario (id) on delete cascade,
  status         public.status_inscricao not null default 'pendente',
  mensagem       text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (id_vaga, id_usuario)
);

create index inscricao_id_usuario_idx on public.inscricao_voluntariado (id_usuario);

create trigger inscricao_atualizado_em before update on public.inscricao_voluntariado
  for each row execute function public.set_atualizado_em();

-- ---------------------------------------------------------------------
-- Mensagens sobre animais perdidos ("Entrar em Contato")
-- ---------------------------------------------------------------------
create table public.mensagem_animal (
  id               bigint generated always as identity primary key,
  id_animal        bigint not null references public.animal (id) on delete cascade,
  id_remetente     uuid not null references public.usuario (id) on delete cascade,
  mensagem         text not null check (char_length(mensagem) between 1 and 2000),
  contato_retorno  text,          -- telefone/e-mail que o remetente aceita compartilhar
  criado_em        timestamptz not null default now()
);

create index mensagem_animal_id_animal_idx on public.mensagem_animal (id_animal);

-- ---------------------------------------------------------------------
-- Notificações (preenchidas por triggers na Fase 7)
-- ---------------------------------------------------------------------
create table public.notificacao (
  id          bigint generated always as identity primary key,
  id_usuario  uuid not null references public.usuario (id) on delete cascade,
  tipo        text not null,
  mensagem    text not null,
  link        text,
  lida        boolean not null default false,
  criado_em   timestamptz not null default now()
);

create index notificacao_usuario_idx on public.notificacao (id_usuario, lida);

-- ---------------------------------------------------------------------
-- Formulário de contato do site
-- ---------------------------------------------------------------------
create table public.mensagem_contato (
  id          bigint generated always as identity primary key,
  id_usuario  uuid references public.usuario (id) on delete set null,
  nome        text not null check (char_length(nome) between 2 and 120),
  email       text not null check (char_length(email) <= 200),
  assunto     text not null check (char_length(assunto) <= 200),
  mensagem    text not null check (char_length(mensagem) between 1 and 5000),
  criado_em   timestamptz not null default now()
);

-- Campos que não podem ser alterados depois de criados
create or replace function public.bloquear_troca_de_dono()
returns trigger
language plpgsql
as $$
begin
  if new.id_usuario is distinct from old.id_usuario then
    raise exception 'Não é permitido alterar o usuário do registro';
  end if;
  return new;
end;
$$;

create trigger adocao_dono_fixo before update on public.adocao
  for each row execute function public.bloquear_troca_de_dono();
create trigger inscricao_dono_fixo before update on public.inscricao_voluntariado
  for each row execute function public.bloquear_troca_de_dono();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.organizacao            enable row level security;
alter table public.usuario                enable row level security;
alter table public.animal                 enable row level security;
alter table public.foto                   enable row level security;
alter table public.adocao                 enable row level security;
alter table public.vaga_voluntariado      enable row level security;
alter table public.inscricao_voluntariado enable row level security;
alter table public.mensagem_animal        enable row level security;
alter table public.notificacao            enable row level security;
alter table public.mensagem_contato       enable row level security;

-- Organização: leitura pública; edição pelo admin da organização; criação/remoção pelo admin do sistema
create policy "organizacao: leitura pública" on public.organizacao
  for select using (true);
create policy "organizacao: admin edita" on public.organizacao
  for update to authenticated using (public.is_admin_org(id)) with check (public.is_admin_org(id));
create policy "organizacao: admin do sistema cria" on public.organizacao
  for insert to authenticated with check (public.is_admin_sistema());
create policy "organizacao: admin do sistema remove" on public.organizacao
  for delete to authenticated using (public.is_admin_sistema());

-- Usuário: cada um vê/edita o próprio perfil; organizações veem quem se relaciona com elas
create policy "usuario: vê o próprio perfil" on public.usuario
  for select to authenticated using (id = auth.uid() or public.is_admin_sistema());
create policy "usuario: organização vê adotantes e voluntários" on public.usuario
  for select to authenticated using (
    exists (
      select 1 from public.adocao ad
      join public.animal an on an.id = ad.id_animal
      where ad.id_usuario = usuario.id and public.is_admin_org(an.id_organizacao)
    )
    or exists (
      select 1 from public.inscricao_voluntariado iv
      join public.vaga_voluntariado v on v.id = iv.id_vaga
      where iv.id_usuario = usuario.id and public.is_admin_org(v.id_organizacao)
    )
  );
create policy "usuario: edita o próprio perfil" on public.usuario
  for update to authenticated using (id = auth.uid() or public.is_admin_sistema())
  with check (id = auth.uid() or public.is_admin_sistema());

-- Animal: leitura pública; usuários comuns registram perdidos/encontrados; organizações gerenciam os seus
create policy "animal: leitura pública" on public.animal
  for select using (true);
create policy "animal: tutor registra perdido/encontrado" on public.animal
  for insert to authenticated with check (
    id_usuario = auth.uid() and id_organizacao is null
    and status in ('perdido', 'encontrado', 'resgatado')
  );
create policy "animal: organização cadastra" on public.animal
  for insert to authenticated with check (public.is_admin_org(id_organizacao));
create policy "animal: tutor atualiza" on public.animal
  for update to authenticated
  using (id_usuario = auth.uid() and id_organizacao is null)
  with check (id_usuario = auth.uid() and id_organizacao is null and status in ('perdido', 'encontrado', 'resgatado'));
create policy "animal: organização atualiza" on public.animal
  for update to authenticated
  using (public.is_admin_org(id_organizacao))
  with check (public.is_admin_org(id_organizacao));
create policy "animal: responsável remove" on public.animal
  for delete to authenticated using (
    (id_usuario = auth.uid() and id_organizacao is null) or public.is_admin_org(id_organizacao)
  );

-- Foto: leitura pública; escrita por quem gerencia o dono da foto
create policy "foto: leitura pública" on public.foto
  for select using (true);
create policy "foto: responsável insere" on public.foto
  for insert to authenticated with check (
    (id_animal is not null and public.pode_gerenciar_animal(id_animal))
    or (id_usuario is not null and id_usuario = auth.uid())
    or (id_organizacao is not null and public.is_admin_org(id_organizacao))
  );
create policy "foto: responsável atualiza" on public.foto
  for update to authenticated using (
    (id_animal is not null and public.pode_gerenciar_animal(id_animal))
    or (id_usuario is not null and id_usuario = auth.uid())
    or (id_organizacao is not null and public.is_admin_org(id_organizacao))
  );
create policy "foto: responsável remove" on public.foto
  for delete to authenticated using (
    (id_animal is not null and public.pode_gerenciar_animal(id_animal))
    or (id_usuario is not null and id_usuario = auth.uid())
    or (id_organizacao is not null and public.is_admin_org(id_organizacao))
  );

-- Adoção: visível ao solicitante e à organização do animal
create policy "adocao: solicitante e organização leem" on public.adocao
  for select to authenticated using (
    id_usuario = auth.uid()
    or exists (select 1 from public.animal a where a.id = id_animal and public.is_admin_org(a.id_organizacao))
  );
create policy "adocao: usuário solicita" on public.adocao
  for insert to authenticated with check (
    id_usuario = auth.uid()
    and status = 'em_analise'
    and exists (
      select 1 from public.animal a
      where a.id = id_animal and a.status in ('disponivel', 'em_processo') and a.id_organizacao is not null
    )
  );
create policy "adocao: solicitante cancela" on public.adocao
  for update to authenticated
  using (id_usuario = auth.uid() and status = 'em_analise')
  with check (id_usuario = auth.uid() and status = 'cancelada');
create policy "adocao: organização decide" on public.adocao
  for update to authenticated
  using (exists (select 1 from public.animal a where a.id = id_animal and public.is_admin_org(a.id_organizacao)))
  with check (exists (select 1 from public.animal a where a.id = id_animal and public.is_admin_org(a.id_organizacao)));

-- Vagas: leitura pública; gestão pela organização
create policy "vaga: leitura pública" on public.vaga_voluntariado
  for select using (true);
create policy "vaga: organização gerencia" on public.vaga_voluntariado
  for all to authenticated
  using (public.is_admin_org(id_organizacao))
  with check (public.is_admin_org(id_organizacao));

-- Inscrições: visíveis ao voluntário e à organização da vaga
create policy "inscricao: voluntário e organização leem" on public.inscricao_voluntariado
  for select to authenticated using (
    id_usuario = auth.uid()
    or exists (select 1 from public.vaga_voluntariado v where v.id = id_vaga and public.is_admin_org(v.id_organizacao))
  );
create policy "inscricao: usuário se inscreve" on public.inscricao_voluntariado
  for insert to authenticated with check (
    id_usuario = auth.uid()
    and status = 'pendente'
    and exists (select 1 from public.vaga_voluntariado v where v.id = id_vaga and v.status = 'aberta')
  );
create policy "inscricao: voluntário cancela" on public.inscricao_voluntariado
  for update to authenticated
  using (id_usuario = auth.uid() and status = 'pendente')
  with check (id_usuario = auth.uid() and status = 'cancelada');
create policy "inscricao: organização decide" on public.inscricao_voluntariado
  for update to authenticated
  using (exists (select 1 from public.vaga_voluntariado v where v.id = id_vaga and public.is_admin_org(v.id_organizacao)))
  with check (exists (select 1 from public.vaga_voluntariado v where v.id = id_vaga and public.is_admin_org(v.id_organizacao)));
create policy "inscricao: organização remove" on public.inscricao_voluntariado
  for delete to authenticated
  using (exists (select 1 from public.vaga_voluntariado v where v.id = id_vaga and public.is_admin_org(v.id_organizacao)));

-- Mensagens sobre animais: remetente e responsável pelo animal leem
create policy "mensagem_animal: envolvidos leem" on public.mensagem_animal
  for select to authenticated using (id_remetente = auth.uid() or public.pode_gerenciar_animal(id_animal));
create policy "mensagem_animal: usuário envia" on public.mensagem_animal
  for insert to authenticated with check (id_remetente = auth.uid());

-- Notificações: cada usuário vê, marca como lida e apaga as suas (inserção apenas por triggers)
create policy "notificacao: dono lê" on public.notificacao
  for select to authenticated using (id_usuario = auth.uid());
create policy "notificacao: dono marca como lida" on public.notificacao
  for update to authenticated using (id_usuario = auth.uid()) with check (id_usuario = auth.uid());
create policy "notificacao: dono apaga" on public.notificacao
  for delete to authenticated using (id_usuario = auth.uid());

-- Contato: qualquer visitante envia; apenas o admin do sistema lê
create policy "mensagem_contato: qualquer um envia" on public.mensagem_contato
  for insert to anon, authenticated with check (id_usuario is null or id_usuario = auth.uid());
create policy "mensagem_contato: admin lê" on public.mensagem_contato
  for select to authenticated using (public.is_admin_sistema());

-- =====================================================================
-- Storage: bucket público "fotos"; cada usuário só escreve na pasta <uid>/
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "fotos: leitura pública" on storage.objects
  for select using (bucket_id = 'fotos');
create policy "fotos: upload na própria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: remove da própria pasta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text);
