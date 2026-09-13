import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { myContentsApi } from '../../api/myContentsApi';
import { catalogApi } from '../../api/catalogApi';
import { FieldFull, FormPage } from '../../components/forms/FormPage';
import { BannerImageField, pickBannerFile } from '../../components/forms/BannerImageField';
import {
  pickCoverFile,
  RepresentativeImageField,
} from '../../components/forms/RepresentativeImageField';
import { RegionCountryFields } from '../../components/forms/RegionCountryFields';

export function EditCasePage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('content');

  useEffect(() => {
    if (!accessToken || !id) return;
    void myContentsApi
      .get(accessToken, 'SUCCESS_CASE', id)
      .then((res) => setItem(res.item))
      .catch((e) => setError(e instanceof Error ? e.message : 'error'))
      .finally(() => setLoading(false));
  }, [accessToken, id]);

  const tips = useMemo(
    () => [
      { title: t('catalog.tipCase1Title'), body: t('catalog.tipCase1Body') },
      { title: t('mine.tipEditTitle'), body: t('mine.tipEditBody') },
      { title: t('mine.tipWithdrawTitle'), body: t('mine.tipWithdrawBody') },
    ],
    [t],
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accessToken || !id) return;
    setError('');
    setMessage('');
    const form = new FormData(e.currentTarget);
    const needs = String(form.get('needs') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((needType) => ({ needType, detail: '' }));
    if (!needs.length) {
      setError(t('catalog.needsRequired'));
      return;
    }
    try {
      if (String(item?.status) === 'PUBLISHED') {
        await myContentsApi.withdraw(accessToken, 'SUCCESS_CASE', id);
      }
      const evidenceNotes = String(form.get('evidence') || '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      await myContentsApi.patchCase(accessToken, id, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        context: String(form.get('context')),
        outcomes: String(form.get('outcomes')),
        bannerLinkUrl: String(form.get('bannerLinkUrl') || '').trim() || null,
        bannerPosition: String(form.get('bannerPosition') || 'ABOVE_FOOTER'),
        country: String(form.get('country')),
        region: String(form.get('region')),
        needs,
        evidenceNotes,
      });
      const cover = pickCoverFile(form);
      if (cover) {
        await catalogApi.uploadCover(accessToken, 'success-cases', id, cover);
      }
      const banner = pickBannerFile(form);
      if (banner) {
        await catalogApi.uploadBanner(accessToken, 'success-cases', id, banner);
      }
      const after = await myContentsApi.get(accessToken, 'SUCCESS_CASE', id);
      if (String(after.item.status) === 'DRAFT') {
        await myContentsApi.submitCase(accessToken, id);
        setMessage(t('mine.savedSubmitted'));
      } else {
        setMessage(t('mine.saved'));
      }
      setItem((await myContentsApi.get(accessToken, 'SUCCESS_CASE', id)).item);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    }
  }

  if (loading) return <p className="text-pequena text-cac-muted">{t('mine.loading')}</p>;
  if (!item) {
    return (
      <p className="text-pequena text-red-700">
        {error || t('mine.notFound')} — <Link to="/my/contents">{t('mine.backList')}</Link>
      </p>
    );
  }

  const needsDefault = Array.isArray(item.needs)
    ? (item.needs as Array<{ needType?: string }>).map((n) => n.needType).filter(Boolean).join(', ')
    : String(item.needs || '');

  return (
    <FormPage
      badge={`${t('mine.edit')} · ${String(item.status)}`}
      title={String(item.title)}
      description={t('mine.editDesc')}
      tips={tips}
      onSubmit={onSubmit}
      submitLabel={t('mine.saveSubmit')}
      error={error}
      message={message}
      tabs={[
        { id: 'content', label: t('mine.tabContent') },
        { id: 'media', label: t('mine.tabMedia') },
      ]}
      activeTab={tab}
      onTabChange={setTab}
      panels={{
        content: (
          <>
            <FieldFull>
              <p className="rounded-lg border border-cac-line bg-[#fbfcfb] px-3 py-2 text-pequena text-cac-muted">
                {(item.organization as { name?: string } | undefined)?.name ?? '—'} ·{' '}
                <button type="button" className="font-bold text-cac-green" onClick={() => navigate('/my/contents')}>
                  {t('mine.backList')}
                </button>
              </p>
            </FieldFull>
            <FieldFull>
              <Input label={t('catalog.title')} name="title" required defaultValue={String(item.title)} />
            </FieldFull>
            <FieldFull>
              <TextArea label={t('catalog.summary')} name="summary" required rows={3} defaultValue={String(item.summary)} />
            </FieldFull>
            <FieldFull>
              <TextArea label={t('catalog.context')} name="context" required rows={4} defaultValue={String(item.context || '')} />
            </FieldFull>
            <FieldFull>
              <TextArea label={t('catalog.outcomes')} name="outcomes" required rows={3} defaultValue={String(item.outcomes || '')} />
            </FieldFull>
            <RegionCountryFields
              defaultRegion={String(item.region || 'africa')}
              defaultCountry={String(item.country || 'MZ')}
            />
            <Input label={t('catalog.needs')} name="needs" required defaultValue={needsDefault} />
            <FieldFull>
              <TextArea label={t('catalog.evidence')} name="evidence" rows={3} defaultValue={String(item.evidence || '')} />
            </FieldFull>
          </>
        ),
        media: (
          <>
            <FieldFull>
              <RepresentativeImageField currentUrl={item.coverImageUrl ? String(item.coverImageUrl) : null} />
            </FieldFull>
            <FieldFull>
              <BannerImageField
                currentUrl={item.bannerImageUrl ? String(item.bannerImageUrl) : null}
                currentLink={item.bannerLinkUrl ? String(item.bannerLinkUrl) : null}
                currentPosition={item.bannerPosition ? String(item.bannerPosition) : 'ABOVE_FOOTER'}
              />
            </FieldFull>
          </>
        ),
      }}
    />
  );
}
