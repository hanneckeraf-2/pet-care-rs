-- Fase 4 (parte 1): novo status para animais perdidos que voltaram para casa.
-- Fica em uma migration separada porque um valor novo de enum não pode ser
-- usado na mesma transação em que é criado.
alter type public.status_animal add value if not exists 'reunido';
