import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { urls } from '../../../config';
import { useAuth } from '../../auth/AuthContext';
import { connectionsApi, type SavedItem } from '../../api/connectionsApi';
import { resolveMediaUrl } from '../../components/forms/RepresentativeImageField';

function typeLabelKey(targetType: string) {
  switch (targetType) {
    case 'TECHNOLOGY':
      return 'fav.typeTech';
    case 'CHALLENGE':
      return 'fav.typeChallenge';
    case 'FUNDING_OFFER':
      return 'fav.typeFunding';
    case 'SUCCESS_CASE':
      return 'fav.typeCase';
    case 'PROJECT':
      return 'fav.typeProject';
    case 'ORGANIZATION':
      return 'fav.typeOrg';
    default:
      return 'fav.typeOther';
  }
}

export function MyFavoritesPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const res = await connectionsApi.listSaved(accessToken);
      setItems(res.items);
    } catch {
      setError(t('fav.loadError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const intent = params.get('intent');
    const targetType = params.get('targetType');
    const targetId = params.get('targetId');
    if (intent !== 'save' || !accessToken || !targetType || !targetId) return;

    let cancelled = false;
    void connectionsApi
      .saveItem(accessToken, { targetType, targetId })
      .then(async () => {
        if (cancelled) return;
        setMessage(t('fav.saved'));
        setParams({}, { replace: true });
        await load();
      })
      .catch(() => {
        if (!cancelled) setError(t('fav.saveError'));
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, load, params, setParams, t]);

  async function remove(id: string) {
    if (!accessToken) return;
    setBusyId(id);
    try {
      await connectionsApi.unsaveItem(accessToken, id);
      setMessage(t('fav.removed'));
      await load();
    } catch {
      setError(t('fav.removeError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">
          {t('fav.badge')}
        </p>
        <h1 className="mt-2 text-grande font-bold text-cac-navy">{t('fav.title')}</h1>
        <p className="mt-2 max-w-2xl text-pequena text-cac-muted">{t('fav.desc')}</p>
      </header>

      {message ? (
        <p className="rounded-xl border border-cac-green/30 bg-cac-green3/40 px-4 py-3 text-pequena font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-pequena font-semibold text-red-900">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="rounded-2xl border border-cac-line bg-white p-5 text-media text-cac-muted shadow-cac">
          {t('dash.loading')}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-cac-line bg-white p-6 shadow-cac">
          <h2 className="text-media font-bold text-cac-navy">{t('fav.emptyTitle')}</h2>
          <p className="mt-2 max-w-xl text-pequena text-cac-muted">{t('fav.emptyHint')}</p>
          <a
            href={urls.www}
            className="mt-5 inline-flex rounded-[12px] bg-cac-navy px-4 py-2.5 text-media font-extrabold text-white transition hover:bg-cac-green2"
          >
            {t('nav.portal')}
          </a>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const cover = resolveMediaUrl(item.target?.coverImageUrl);
            const portalHref = item.target?.portalPath
              ? `${urls.www}${item.target.portalPath}`
              : urls.www;
            const title = item.target?.title ?? t('fav.unavailableTitle');
            return (
              <li
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-cac-line bg-white p-4 shadow-cac sm:flex-row sm:items-stretch"
              >
                <div className="h-28 w-full shrink-0 overflow-hidden rounded-[14px] bg-gradient-to-br from-[#b8d7bf] to-[#dce9d3] sm:h-auto sm:w-36">
                  {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-mini font-extrabold tracking-[0.4px] text-cac-green uppercase">
                    {t(typeLabelKey(item.targetType))}
                  </p>
                  <h2 className="mt-1 text-media font-bold text-cac-navy">{title}</h2>
                  {item.target?.organizationName ? (
                    <p className="mt-1 text-pequena text-cac-muted">{item.target.organizationName}</p>
                  ) : null}
                  {item.target?.summary ? (
                    <p className="mt-2 line-clamp-2 text-pequena leading-relaxed text-cac-muted">
                      {item.target.summary}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={portalHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-[12px] bg-cac-navy px-3.5 py-2 text-pequena font-extrabold text-white transition hover:bg-cac-green2"
                    >
                      {t('fav.openPortal')}
                    </a>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busyId === item.id}
                      onClick={() => void remove(item.id)}
                    >
                      {t('fav.remove')}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
