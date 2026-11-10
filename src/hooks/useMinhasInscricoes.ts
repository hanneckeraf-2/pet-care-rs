import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Enums } from '../types/database';

/** Mapa id_vaga -> status da inscrição ativa mais recente do usuário logado. */
export function useMinhasInscricoes() {
  const { user } = useAuth();
  const [inscricoes, setInscricoes] = useState<Map<number, Enums<'status_inscricao'>>>(new Map());

  const recarregar = useCallback(async () => {
    if (!user) return setInscricoes(new Map());
    const { data } = await supabase
      .from('inscricao_voluntariado')
      .select('id_vaga, status')
      .eq('id_usuario', user.id)
      .order('criado_em', { ascending: true });
    // a ordem crescente faz a inscrição mais recente sobrescrever as antigas
    setInscricoes(new Map((data ?? []).map((i) => [i.id_vaga, i.status])));
  }, [user]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { inscricoes, recarregar };
}
