-- Nova situação do animal: está acolhido em um lar temporário (e continua disponível para adoção).
-- Migration separada porque um valor novo de enum não pode ser usado na mesma transação.
alter type public.status_animal add value if not exists 'em_lar_temporario';
