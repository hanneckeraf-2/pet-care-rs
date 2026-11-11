-- =====================================================================
-- Pet Care RS - Preparação do banco de PRODUÇÃO com as organizações parceiras
--
-- Rode UMA VEZ no SQL Editor do Supabase de produção (pode repetir sem duplicar).
-- NÃO é uma migration: não roda nos testes nem no ambiente local. O seed.sql
-- continua com dados fictícios, só para desenvolvimento.
--
-- O que faz:
--   1. Remove as organizações fictícias do seed (e, em cascata, seus animais,
--      fotos, vagas, adoções e inscrições).
--   2. Rebaixa para usuário comum quem era admin de uma organização removida.
--   3. Cadastra as organizações parceiras reais (dados públicos do Instagram).
-- =====================================================================

begin;

-- 1. Dados fictícios
delete from public.organizacao
where nome in ('Abrigo Patas Unidas', 'ONG Amigo Fiel', 'Lar Temporário Esperança');

-- 2. Administradores que ficaram sem organização
update public.usuario
set tipo_usuario = 'comum'
where tipo_usuario = 'admin_org' and id_organizacao is null;

-- 3. Organizações parceiras (telefone, e-mail, Pix, necessidades e foto são
--    preenchidos pelos próprios parceiros no painel: /admin/perfil)
insert into public.organizacao (nome, descricao, endereco, cidade, contatos)
select
  'Projeto Mãos e Patas',
  'Projeto de proteção animal que nasceu na maior enchente do Rio Grande do Sul, em 2024. Trabalho 100% voluntário: resgate, cuidado e adoção responsável de cães e gatos.',
  'São Leopoldo/RS',
  'São Leopoldo',
  '{"instagram": "https://www.instagram.com/maosepatasrs/", "site": "https://beacons.ai/maosepatasrs"}'::jsonb
where not exists (select 1 from public.organizacao where nome = 'Projeto Mãos e Patas');

insert into public.organizacao (nome, descricao, endereco, cidade, contatos)
select
  'Adote um Amigo',
  'Projeto que começou durante a maior enchente do Rio Grande do Sul, em 2024, e desde então segue transformando vidas por meio da adoção responsável. Atuação voluntária.',
  'São Leopoldo/RS',
  'São Leopoldo',
  '{"instagram": "https://www.instagram.com/adoteumamigo_sl/"}'::jsonb
where not exists (select 1 from public.organizacao where nome = 'Adote um Amigo');

commit;

-- ---------------------------------------------------------------------
-- 4. Vincular o responsável de cada parceira (depois que ele criar a conta
--    no site). Descomente, troque o e-mail e rode:
-- ---------------------------------------------------------------------
-- update public.usuario
-- set tipo_usuario = 'admin_org',
--     id_organizacao = (select id from public.organizacao where nome = 'Projeto Mãos e Patas')
-- where email = 'responsavel-maos-e-patas@exemplo.com';
--
-- update public.usuario
-- set tipo_usuario = 'admin_org',
--     id_organizacao = (select id from public.organizacao where nome = 'Adote um Amigo')
-- where email = 'responsavel-adote-um-amigo@exemplo.com';

-- ---------------------------------------------------------------------
-- 5. Conferência
-- ---------------------------------------------------------------------
select id, nome, cidade, contatos from public.organizacao order by nome;

select u.nome, u.email, u.tipo_usuario, o.nome as organizacao
from public.usuario u
left join public.organizacao o on o.id = u.id_organizacao
where u.tipo_usuario <> 'comum';
