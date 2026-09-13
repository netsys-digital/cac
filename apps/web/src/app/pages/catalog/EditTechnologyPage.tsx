import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { myContentsApi } from '../../api/myContentsApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';
import { catalogApi } from '../../api/catalogApi';
import { BannerImageField, pickBannerFile } from '../../components/forms/BannerImageField';
import {
  pickCoverFile,
  RepresentativeImageField,
} from '../../components/forms/RepresentativeImageField';
import { RegionCountryFields } from '../../components/forms/RegionCountryFields';

function parseTags(raw: FormDataEntryValue | null): string[] {
  return String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function EditTechnologyPage() {
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
      .get(accessToken, 'TECHNOLOGY', id)
      .then((res) => setItem(res.item))
      .catch((e) => setError(e instanceof Error ? e.message : 'error'))
      .finally(() => setLoading(false));
  }, [accessToken, id]);

  const tips = useMemo(
    () => [
      { title: t('catalog.tipTech1Title'), body: t('catalog.tipTech1Body') },
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
    const tags = parseTags(form.get('tags'));
    if (!tags.length) {
      setError(t('catalog.tagsRequired'));
      return;
    }
    const status = String(item?.status ?? '');
    try {
      if (status === 'PUBLISHED') {
        await myContentsApi.withdraw(accessToken, 'TECHNOLOGY', id);
      }
      await myContentsApi.patchTechnology(accessToken, id, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        problemStatement: String(form.get('problemStatement')),
        howItWorks: String(form.get('howItWorks')),
        videoUrl: String(form.get('videoUrl') || '').trim() || null,
        bannerLinkUrl: String(form.get('bannerLinkUrl') || '').trim() || null,
        bannerPosition: String(form.get('bannerPosition') || 'ABOVE_FOOTER'),
        country: String(form.get('country')),
        region: String(form.get('region')),
        maturity: String(form.get('maturity')),
        tags,
      });
      const cover = pickCoverFile(form);
      if (cover) {
        await catalogApi.uploadCover(accessToken, 'technologies', id, cover);
      }
      const banner = pickBannerFile(form);
      if (banner) {
        await catalogApi.uploadBanner(accessToken, 'technologies', id, banner);
      }
      const after = await myContentsApi.get(accessToken, 'TECHNOLOGY', id);
      setItem(after.item);
      if (String(after.item.status) === 'DRAFT') {
        await myContentsApi.submitTechnology(accessToken, id);
        setMessage(t('mine.savedSubmitted'));
      } else {
        setMessage(t('mine.saved'));
      }
      const refreshed = await myContentsApi.get(accessToken, 'TECHNOLOGY', id);
      setItem(refreshed.item);
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

  const tags = Array.isArray(item.tags) ? (item.tags as string[]).join(', ') : '';

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
                {(item.organization as { name?: string } | undefined)?.name ?? '—'} · {String(item.slug)} ·{' '}
                <button type="button" className="font-bold text-cac-green" onClick={() => navigate('/my/contents')}>
                  {t('mine.backList')}
                </button>
              </p>
            </FieldFull>
            <FieldFull>
              <Input label={t('catalog.title')} hint={t('catalog.titleHint')} name="title" required defaultValue={String(item.title)} />
            </FieldFull>
            <FieldFull>
              <TextArea label={t('catalog.summary')} hint={t('catalog.summaryHint')} name="summary" required rows={3} defaultValue={String(item.summary)} />
            </FieldFull>
            <FieldFull>
              <TextArea label={t('catalog.problem')} hint={t('catalog.problemHint')} name="problemStatement" required rows={4} defaultValue={String(item.problemStatement)} />
            </FieldFull>
            <FieldFull>
              <TextArea label={t('catalog.how')} hint={t('catalog.howHint')} name="howItWorks" required rows={4} defaultValue={String(item.howItWorks)} />
            </FieldFull>
            <FieldFull>
              <Input
                label={t('catalog.videoUrl')}
                hint={t('catalog.videoUrlHint')}
                name="videoUrl"
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                defaultValue={item.videoUrl ? String(item.videoUrl) : ''}
              />
            </FieldFull>
            <RegionCountryFields
              defaultRegion={String(item.region || 'south_america')}
              defaultCountry={String(item.country || 'BR')}
            />
            <SelectField
              label={t('catalog.maturity')}
              hint={t('catalog.maturityHint')}
              name="maturity"
              required
              defaultValue={String(item.maturity || 'READY_FOR_IMPLEMENTATION')}
            >
              <option value="RESEARCH">{t('catalog.maturityResearch')}</option>
              <option value="VALIDATION">{t('catalog.maturityValidation')}</option>
              <option value="DEMONSTRATION">{t('catalog.maturityDemonstration')}</option>
              <option value="READY_FOR_IMPLEMENTATION">{t('catalog.maturityReady')}</option>
              <option value="AT_SCALE">{t('catalog.maturityScale')}</option>
            </SelectField>
            <FieldFull>
              <Input label={t('catalog.tags')} hint={t('catalog.tagsHint')} name="tags" required defaultValue={tags} />
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
