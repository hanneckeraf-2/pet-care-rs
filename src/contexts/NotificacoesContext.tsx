import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database';
import { useAuth } from './AuthContext';

export type Notificacao = Tables<'notificacao'>;

type Ctx = {
  notificacoes: Notificacao[];
  naoLidas: number;
  carregando: boolean;
  marcarLida: (id: number) => Promise<void>;
  marcarTodasLidas: () => Promise<void>;
  remover: (id: number) => Promise<void>;
};

const NotificacoesContext = createContext<Ctx | undefined>(undefined);
const LIMITE = 50;

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!userId) {
      setNotificacoes([]);
      return;
    }
    let ativo = true;
    setCarregando(true);
    supabase
      .from('notificacao')
      .select('*')
      .eq('id_usuario', userId)
      .order('criado_em', { ascending: false })
      .limit(LIMITE)
      .then(({ data }) => {
        if (!ativo) return;
        setNotificacoes(data ?? []);
        setCarregando(false);
      });

    // novas notificações chegam em tempo real (Realtime respeita o RLS da tabela)
    const canal = supabase
      .channel(`notificacoes-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacao', filter: `id_usuario=eq.${userId}` },
        (payload) => {
          const nova = payload.new as Notificacao;
          setNotificacoes((lista) => (lista.some((n) => n.id === nova.id) ? lista : [nova, ...lista].slice(0, LIMITE)));
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(canal);
    };
  }, [userId]);

  const marcarLida = useCallback(async (id: number) => {
    setNotificacoes((l) => l.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    await supabase.from('notificacao').update({ lida: true }).eq('id', id);
  }, []);

  const marcarTodasLidas = useCallback(async () => {
    if (!userId) return;
    setNotificacoes((l) => l.map((n) => ({ ...n, lida: true })));
    await supabase.from('notificacao').update({ lida: true }).eq('id_usuario', userId).eq('lida', false);
  }, [userId]);

  const remover = useCallback(async (id: number) => {
    setNotificacoes((l) => l.filter((n) => n.id !== id));
    await supabase.from('notificacao').delete().eq('id', id);
  }, []);

  const value = useMemo(
    () => ({
      notificacoes,
      naoLidas: notificacoes.filter((n) => !n.lida).length,
      carregando,
      marcarLida,
      marcarTodasLidas,
      remover,
    }),
    [notificacoes, carregando, marcarLida, marcarTodasLidas, remover]
  );

  return <NotificacoesContext.Provider value={value}>{children}</NotificacoesContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotificacoes() {
  const ctx = useContext(NotificacoesContext);
  if (!ctx) throw new Error('useNotificacoes deve ser usado dentro de <NotificacoesProvider>');
  return ctx;
}
