import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner';

type Props = {
  children: ReactNode;
  /** exige perfil de administrador de organização */
  admin?: boolean;
};

/** Redireciona para /entrar quem não está logado (e de volta depois do login). */
export default function ProtectedRoute({ children, admin = false }: Props) {
  const { user, perfil, loading, isAdminOrg } = useAuth();
  const location = useLocation();

  if (loading || (user && !perfil && admin)) return <Spinner />;

  if (!user) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname + location.search }} />;
  }

  if (admin && !isAdminOrg) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-2">Acesso restrito</h1>
        <p className="text-gray-600">
          Esta área é exclusiva para administradores de organizações. Se você representa uma ONG ou abrigo, entre em contato conosco.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
