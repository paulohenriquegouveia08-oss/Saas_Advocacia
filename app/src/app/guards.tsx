// ============================================
// Juris Gestão — Route Guards (RBAC)
// Proteção de rotas baseada em cargo
// ============================================

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPermission?: string;
}

/**
 * Componente de proteção de rota.
 * - Se o usuário não estiver autenticado → redireciona para /login.
 * - Se requireAdmin = true e o user não for admin → redireciona para /dashboard.
 * - Se requiredPermission for definida, valida contra role.permissions.
 */
export function ProtectedRoute({ children, requireAdmin, requiredPermission }: ProtectedRouteProps) {
  const { user, session, loading } = useAuth();
  console.log('[ProtectedRoute] Rendered. session:', !!session, 'user:', !!user, 'loading:', loading);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
        <span>Carregando...</span>
      </div>
    );
  }

  // Não autenticado
  if (!session || !user) {
    return <Navigate to="/login" replace />;
  }

  // Usuário inativo
  if (!user.active) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se é admin
  if (requireAdmin && !user.role?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar permissão específica
  if (requiredPermission && !user.role?.isAdmin) {
    const perms = (user.role?.permissions ?? {}) as Record<string, boolean>;
    if (!perms[requiredPermission]) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Rota pública — redireciona se já autenticado.
 */
export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, user, loading } = useAuth();
  console.log('[PublicRoute] Rendered. session:', !!session, 'user:', !!user, 'loading:', loading);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
        <span>Carregando...</span>
      </div>
    );
  }

  if (session && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
