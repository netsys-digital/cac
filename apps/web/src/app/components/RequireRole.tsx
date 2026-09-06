import { Navigate, Outlet } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import type { UserRole } from '@cac/shared';
import { useAuth } from '../auth/AuthContext';

export function RequireRole({
  roles,
  children,
}: PropsWithChildren<{ roles: UserRole[] }>) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-cac-muted">…</div>;
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children ?? <Outlet />;
}
