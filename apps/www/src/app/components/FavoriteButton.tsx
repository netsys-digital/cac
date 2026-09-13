import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePortalAuth } from '../auth/PortalAuthContext';
import { urls } from '../../config';

function loginHrefForCurrentPage() {
  const back = new URL(window.location.href);
  back.searchParams.set('azcLike', '1');
  return `${urls.web}/login?returnUrl=${encodeURIComponent(back.toString())}`;
}

export function DetailFavoriteButton({
  targetType,
  targetId,
}: {
  targetType: string;
  targetId: string;
}) {
  const { t } = useTranslation();
  const { user, loading, getAccessToken } = usePortalAuth();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function loadSavedState(token: string) {
    const qs = new URLSearchParams({ targetType, targetId });
    const res = await fetch(`${urls.api}/api/saved-items?${qs}`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      items?: Array<{ id: string; targetType?: string; targetId?: string }>;
    };
    const hit = (data.items ?? []).find(
      (item) => item.targetId === targetId && item.targetType === targetType,
    );
    setSaved(Boolean(hit));
    setSavedId(hit?.id ?? null);
  }

  async function saveFavorite(token: string) {
    const res = await fetch(`${urls.api}/api/saved-items`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetType, targetId }),
    });
    if (!res.ok) throw new Error('save_failed');
    const data = (await res.json()) as { item?: { id?: string } };
    setSaved(true);
    setSavedId(data.item?.id ?? null);
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (loading) return;
      const token = await getAccessToken();
      if (cancelled || !token) {
        setSaved(false);
        setSavedId(null);
        return;
      }

      try {
        await loadSavedState(token);
        if (cancelled) return;

        const params = new URLSearchParams(window.location.search);
        if (params.get('azcLike') === '1') {
          await saveFavorite(token);
          if (cancelled) return;
          params.delete('azcLike');
          const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
          window.history.replaceState({}, '', next);
        }
      } catch {
        /* ignore bootstrap errors */
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one load per item/session
  }, [getAccessToken, loading, targetId, targetType]);

  async function onToggle() {
    if (busy || loading) return;
    setError('');

    const token = await getAccessToken();
    if (!token) {
      window.location.assign(loginHrefForCurrentPage());
      return;
    }

    const nextSaved = !saved;
    const prevId = savedId;
    setBusy(true);
    setSaved(nextSaved);
    if (!nextSaved) setSavedId(null);

    try {
      if (nextSaved) {
        await saveFavorite(token);
      } else if (prevId) {
        const res = await fetch(`${urls.api}/api/saved-items/${prevId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok && res.status !== 204) throw new Error('unsave_failed');
      }
    } catch {
      setSaved(!nextSaved);
      setSavedId(prevId);
      setError(t('detail.favoriteError'));
    } finally {
      setBusy(false);
    }
  }

  const label = saved ? t('detail.favorited') : t('detail.favorite');
  const signedIn = Boolean(user);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        aria-pressed={saved}
        aria-label={label}
        title={label}
        disabled={busy || loading}
        onClick={() => void onToggle()}
        className="group flex w-full items-center justify-center gap-2.5 rounded-[12px] border border-cac-line bg-[#f7faf8] px-4 py-3 text-pequena font-bold text-cac-navy transition hover:border-[#e11d48]/35 hover:bg-[#fff5f7] disabled:opacity-70"
      >
        <i
          className={`${
            saved ? 'fa-solid text-[#e11d48]' : 'fa-regular text-cac-muted group-hover:text-[#e11d48]'
          } fa-heart text-[1.35rem] transition-transform ${saved ? 'scale-110' : ''} ${busy ? 'animate-pulse' : ''}`}
          aria-hidden
        />
        <span className={saved ? 'text-[#e11d48]' : ''}>{label}</span>
      </button>
      {error ? <p className="text-mini text-red-700">{error}</p> : null}
      {!loading && !signedIn ? (
        <p className="text-mini leading-snug text-cac-muted">{t('detail.favoriteLoginHint')}</p>
      ) : null}
    </div>
  );
}
