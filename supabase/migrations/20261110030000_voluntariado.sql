-- Fase 5: voluntariado
-- A restrição unique (id_vaga, id_usuario) impedia o voluntário de se inscrever
-- novamente depois de cancelar. Agora só é proibido ter duas inscrições ativas.
alter table public.inscricao_voluntariado drop constraint inscricao_voluntariado_id_vaga_id_usuario_key;

create unique index inscricao_unica_ativa on public.inscricao_voluntariado (id_vaga, id_usuario)
  where status in ('pendente', 'aprovada');

create index vaga_status_idx on public.vaga_voluntariado (status);
