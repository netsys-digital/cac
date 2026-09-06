import { Navigate, useLocation } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useAuth } from '../auth/AuthContext';

export function RequireAuth({ children }: PropsWithChildren) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-cac-muted">…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
