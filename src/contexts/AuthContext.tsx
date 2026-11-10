import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database';

export type Perfil = Tables<'usuario'>;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  /** true enquanto a sessão inicial ainda está sendo carregada */
  loading: boolean;
  /** true quando o usuário chegou pelo link de redefinição de senha */
  recuperandoSenha: boolean;
  isAdminOrg: boolean;
  recarregarPerfil: () => Promise<void>;
  sair: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);

  const carregarPerfil = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setPerfil(null);
      return;
    }
    const { data, error } = await supabase.from('usuario').select('*').eq('id', userId).maybeSingle();
    if (error) console.error('Erro ao carregar perfil', error);
    setPerfil(data ?? null);
  }, []);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;
      setSession(data.session);
      await carregarPerfil(data.session?.user.id);
      if (ativo) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, novaSessao) => {
      setSession(novaSessao);
      if (event === 'PASSWORD_RECOVERY') setRecuperandoSenha(true);
      if (event === 'SIGNED_OUT') setRecuperandoSenha(false);
      // Não aguardar consultas dentro do callback (recomendação do supabase-js para evitar deadlock)
      setTimeout(() => {
        if (ativo) carregarPerfil(novaSessao?.user.id);
      }, 0);
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, [carregarPerfil]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      perfil,
      loading,
      recuperandoSenha,
      isAdminOrg: perfil?.tipo_usuario === 'admin_org' || perfil?.tipo_usuario === 'admin_sistema',
      recarregarPerfil: () => carregarPerfil(session?.user.id),
      sair: async () => {
        await supabase.auth.signOut();
        setPerfil(null);
      },
    }),
    [session, perfil, loading, recuperandoSenha, carregarPerfil]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
