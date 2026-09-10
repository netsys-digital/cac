import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ORG_PUBLISH_KINDS, type OrgPublishKind } from '@cac/shared';
import { Button } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type AdminOrganization } from '../../api/catalogApi';
import { PublishKindsPicker } from '../../components/forms/PublishKindsPicker';
import { resolveMediaUrl } from '../../components/forms/RepresentativeImageField';

type StatusFilter = 'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED';
type KindFilter = 'ALL' | OrgPublishKind;

export function AdminOrganizationsPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [items, setItems] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [draftKinds, setDraftKinds] = useState<Record<string, OrgPublishKind[]>>({});

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [region, setRegion] = useState('ALL');
  const [country, setCountry] = useState('ALL');
  const [kind, setKind] = useState<KindFilter>('ALL');

  const load = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await catalogApi.adminOrganizations(accessToken);
      setItems(res.items ?? []);
      setDraftKinds((prev) => {
        const next = { ...prev };
        for (const o of res.items ?? []) {
          if (!next[o.id]) next[o.id] = [...(o.publishKinds ?? [])];
        }
        return next;
      });
    } catch (e) {
      setItems([]);
      setError(e instanceof Error ? e.message : t('admin.orgsError'));
    } finally {
      setLoading(false);
    }
  }, [accessToken, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const regions = useMemo(
    () =>
      [...new Set(items.map((o) => o.region).filter((v): v is string => Boolean(v)))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [items],
  );

  const countries = useMemo(() => {
    const pool =
      region === 'ALL' ? items : items.filter((o) => (o.region ?? '') === region);
    return [
      ...new Set(pool.map((o) => o.country).filter((v): v is string => Boolean(v))),
    ].sort((a, b) => a.localeCompare(b));
  }, [items, region]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((o) => {
      if (status !== 'ALL' && o.verificationStatus !== status) return false;
      if (region !== 'ALL' && (o.region ?? '') !== region) return false;
      if (country !== 'ALL' && (o.country ?? '') !== country) return false;
      if (kind !== 'ALL' && !(o.publishKinds ?? []).includes(kind)) return false;
      if (!needle) return true;
      const hay = `${o.name} ${o.slug} ${o.country ?? ''} ${o.region ?? ''}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [items, q, status, region, country, kind]);

  const statusCounts = useMemo(() => {
    const base = { PENDING: 0, VERIFIED: 0, REJECTED: 0 };
    for (const o of items) {
      if (o.verificationStatus in base) {
        base[o.verificationStatus as keyof typeof base] += 1;
      }
    }
    return base;
  }, [items]);

  const hasActiveFilters =
    q.trim().length > 0 || status !== 'ALL' || region !== 'ALL' || country !== 'ALL' || kind !== 'ALL';

  function clearFilters() {
    setQ('');
    setStatus('ALL');
    setRegion('ALL');
    setCountry('ALL');
    setKind('ALL');
  }

  async function save(org: AdminOrganization) {
    if (!accessToken) return;
    setBusyId(org.id);
    setMessage('');
    setError('');
    try {
      await catalogApi.updateOrganization(accessToken, org.id, {
        publishKinds: draftKinds[org.id] ?? [],
      });
      setMessage(t('admin.orgsSaved', { name: org.name }));
      await load();
    } catch {
      setError(t('admin.orgsError'));
    } finally {
      setBusyId(null);
    }
  }

  async function verify(org: AdminOrganization) {
    if (!accessToken) return;
    setBusyId(org.id);
    setError('');
    try {
      await catalogApi.verifyOrganization(accessToken, org.id);
      setMessage(t('admin.orgsVerified', { name: org.name }));
      await load();
    } catch {
      setError(t('admin.orgsError'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
        <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
          {t('admin.orgsEyebrow')}
        </p>
        <h1 className="mt-1 text-grande font-bold text-cac-navy">{t('admin.orgsTitle')}</h1>
        <p className="mt-2 max-w-3xl text-media text-cac-muted">{t('admin.orgsSupport')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              ['ALL', items.length],
              ['PENDING', statusCounts.PENDING],
              ['VERIFIED', statusCounts.VERIFIED],
              ['REJECTED', statusCounts.REJECTED],
            ] as const
          ).map(([key, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`rounded-full border px-3 py-1.5 text-pequena font-bold transition ${
                status === key
                  ? 'border-cac-navy bg-cac-navy text-white'
                  : 'border-cac-line bg-[#fbfcfb] text-cac-navy hover:bg-cac-green3'
              }`}
            >
              {key === 'ALL' ? t('admin.orgsFilterAllStatus') : t(`admin.orgStatus.${key}`)} {count}
            </button>
          ))}
        </div>
      </header>

      <section className="space-y-3 rounded-[18px] border border-cac-line bg-white p-4 shadow-cac md:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[220px] flex-1">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('admin.orgsFilterSearch')}
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin.orgsFilterSearchPlaceholder')}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            />
          </label>
          <label className="min-w-[140px]">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('admin.orgsFilterRegion')}
            </span>
            <select
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setCountry('ALL');
              }}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            >
              <option value="ALL">{t('admin.orgsFilterAllRegions')}</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[140px]">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('admin.orgsFilterCountry')}
            </span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            >
              <option value="ALL">{t('admin.orgsFilterAllCountries')}</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[160px]">
            <span className="mb-1 block text-pequena font-bold uppercase tracking-wide text-cac-muted">
              {t('admin.orgsFilterKind')}
            </span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as KindFilter)}
              className="w-full rounded-xl border border-cac-line bg-cac-bg px-3.5 py-2.5 text-media text-cac-navy outline-none focus:border-cac-green"
            >
              <option value="ALL">{t('admin.orgsFilterAllKinds')}</option>
              {ORG_PUBLISH_KINDS.map((k) => (
                <option key={k} value={k}>
                  {t(`admin.publishKind.${k}`)}
                </option>
              ))}
            </select>
          </label>
          {hasActiveFilters ? (
            <Button type="button" variant="secondary" onClick={clearFilters}>
              {t('admin.orgsFilterClear')}
            </Button>
          ) : null}
        </div>
        <p className="text-pequena text-cac-muted">
          {t('admin.orgsFilteredTotal', { count: filtered.length, total: items.length })}
        </p>
      </section>

      {message ? (
        <p className="rounded-xl border border-cac-line bg-cac-green3/40 px-4 py-3 text-media font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}
      {error ? (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-media font-semibold text-red-800">{error}</p>
          <p className="text-pequena text-red-800/80">{t('admin.orgsLoadHint')}</p>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            {t('admin.orgsRetry')}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <p className="text-media text-cac-muted">{t('dash.loading')}</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((org) => {
            const logo = resolveMediaUrl(org.logoUrl);
            return (
              <li key={org.id} className="rounded-2xl border border-cac-line bg-white p-4 shadow-cac">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    {logo ? (
                      <img
                        src={logo}
                        alt=""
                        className="size-12 shrink-0 rounded-xl border border-cac-line object-cover"
                      />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[linear-gradient(145deg,#0a2440,#1a4d4a)] text-pequena font-bold text-[#90d6b6]">
                        {org.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-media font-bold text-cac-navy">{org.name}</p>
                      <p className="text-pequena text-cac-muted">
                        {org.slug}
                        {org.country ? ` · ${org.country}` : ''}
                        {org.region ? ` · ${org.region}` : ''}
                      </p>
                      <p className="mt-1 text-mini text-cac-muted">
                        {t('admin.orgsCounts', {
                          members: org._count?.members ?? 0,
                          tech: org._count?.technologies ?? 0,
                          challenges: org._count?.challenges ?? 0,
                          offers: org._count?.fundingOffers ?? 0,
                          cases: org._count?.successCases ?? 0,
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex w-fit rounded-full px-2.5 py-1 text-mini font-bold uppercase tracking-wide ${
                      org.verificationStatus === 'VERIFIED'
                        ? 'bg-cac-green3 text-cac-green'
                        : org.verificationStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {t(`admin.orgStatus.${org.verificationStatus}`)}
                  </span>
                </div>

                <div className="mt-4">
                  <PublishKindsPicker
                    idPrefix={`org-${org.id}`}
                    value={draftKinds[org.id] ?? []}
                    onChange={(next) => setDraftKinds((prev) => ({ ...prev, [org.id]: next }))}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button disabled={busyId === org.id} onClick={() => void save(org)}>
                    {busyId === org.id ? t('admin.working') : t('admin.orgsSave')}
                  </Button>
                  {org.verificationStatus !== 'VERIFIED' ? (
                    <Button
                      variant="secondary"
                      disabled={busyId === org.id}
                      onClick={() => void verify(org)}
                    >
                      {t('admin.verifyOrg')}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
          {!filtered.length ? (
            <li className="rounded-2xl border border-dashed border-cac-line bg-white px-4 py-8 text-center text-media text-cac-muted">
              {items.length ? t('admin.orgsFilterEmpty') : t('admin.orgsEmpty')}
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
