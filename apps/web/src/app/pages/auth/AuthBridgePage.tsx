import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { urls } from '../../../config';

/**
 * Página silenciosa carregada em iframe pelo portal (www).
 * Envia a sessão do painel via postMessage para sincronizar login entre portas locais.
 */
export function AuthBridgePage() {
  const { user, loading, ensureAccessToken } = useAuth();
  const [params] = useSearchParams();

  useEffect(() => {
    if (loading) return;
    if (window.parent === window) return;

    const originParam = params.get('origin');
    let targetOrigin = urls.www;
    try {
      if (originParam) {
        const parsed = new URL(originParam);
        if (parsed.origin === new URL(urls.www).origin) targetOrigin = parsed.origin;
      }
    } catch {
      /* keep default */
    }

    let cancelled = false;
    void (async () => {
      const token = user ? await ensureAccessToken() : null;
      if (cancelled) return;
      window.parent.postMessage(
        {
          source: 'cac-auth-bridge',
          accessToken: token,
          user: token && user ? user : null,
        },
        targetOrigin,
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureAccessToken, loading, params, user]);

  return (
    <div className="grid min-h-screen place-items-center bg-white text-pequena text-cac-muted">
      …
    </div>
  );
}
