-- Fase 6: painel da organização

-- ---------------------------------------------------------------------
-- Aprovar/rejeitar adoção de forma atômica.
-- security invoker: as políticas RLS de quem chama continuam valendo.
-- Ao aprovar: animal vira "adotado" e as demais solicitações em análise
-- para o mesmo animal são rejeitadas automaticamente.
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
begin
  select ad.id_animal, an.id_organizacao
    into v_animal, v_org
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

  if p_aprovar then
    update public.animal set status = 'adotado' where id = v_animal;

    update public.adocao
       set status = 'rejeitada',
           descricao = 'O animal foi adotado por outra família. Obrigado pelo interesse!'
     where id_animal = v_animal and status = 'em_analise' and id <> p_id;
  end if;
end;
$$;

revoke execute on function public.decidir_adocao(bigint, boolean, text) from public, anon;
grant execute on function public.decidir_adocao(bigint, boolean, text) to authenticated;

-- ---------------------------------------------------------------------
-- Relatório: adoções por mês (security_invoker -> respeita RLS de adocao/animal)
-- ---------------------------------------------------------------------
create or replace view public.vw_adocoes_por_mes
with (security_invoker = true) as
select
  an.id_organizacao,
  date_trunc('month', ad.criado_em)::date as mes,
  count(*)::int as solicitacoes,
  (count(*) filter (where ad.status = 'aprovada'))::int as aprovadas
from public.adocao ad
join public.animal an on an.id = ad.id_animal
where an.id_organizacao is not null
group by an.id_organizacao, date_trunc('month', ad.criado_em);

grant select on public.vw_adocoes_por_mes to authenticated;

-- ---------------------------------------------------------------------
-- Storage: quem gerencia o animal/organização também pode apagar
-- arquivos enviados por outro administrador da mesma organização.
-- ---------------------------------------------------------------------
create policy "fotos: responsável remove" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'fotos'
    and exists (
      select 1 from public.foto f
      where f.storage_path = storage.objects.name
        and (
          (f.id_animal is not null and public.pode_gerenciar_animal(f.id_animal))
          or (f.id_organizacao is not null and public.is_admin_org(f.id_organizacao))
        )
    )
  );
