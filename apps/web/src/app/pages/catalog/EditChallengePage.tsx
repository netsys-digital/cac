import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { myContentsApi } from '../../api/myContentsApi';
import { catalogApi } from '../../api/catalogApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';
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

export function EditChallengePage() {
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
      .get(accessToken, 'CHALLENGE', id)
      .then((res) => setItem(res.item))
      .catch((e) => setError(e instanceof Error ? e.message : 'error'))
      .finally(() => setLoading(false));
  }, [accessToken, id]);

  const tips = useMemo(
    () => [
      { title: t('catalog.tipCh1Title'), body: t('catalog.tipCh1Body') },
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
    try {
      if (String(item?.status) === 'PUBLISHED') {
        await myContentsApi.withdraw(accessToken, 'CHALLENGE', id);
      }
      await myContentsApi.patchChallenge(accessToken, id, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        context: String(form.get('context')),
        needType: String(form.get('needType')),
        bannerLinkUrl: String(form.get('bannerLinkUrl') || '').trim() || null,
        bannerPosition: String(form.get('bannerPosition') || 'ABOVE_FOOTER'),
        country: String(form.get('country')),
        region: String(form.get('region')),
        tags,
      });
      const cover = pickCoverFile(form);
      if (cover) {
        await catalogApi.uploadCover(accessToken, 'challenges', id, cover);
      }
      const banner = pickBannerFile(form);
      if (banner) {
        await catalogApi.uploadBanner(accessToken, 'challenges', id, banner);
      }
      const after = await myContentsApi.get(accessToken, 'CHALLENGE', id);
      if (String(after.item.status) === 'DRAFT') {
        await myContentsApi.submitChallenge(accessToken, id);
        setMessage(t('mine.savedSubmitted'));
      } else {
        setMessage(t('mine.saved'));
      }
      setItem((await myContentsApi.get(accessToken, 'CHALLENGE', id)).item);
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
              <TextArea label={t('catalog.summary')} name="summary" required rows={4} defaultValue={String(item.summary)} />
            </FieldFull>
            <FieldFull>
              <TextArea
                label={t('catalog.context')}
                hint={t('catalog.contextChallengeHint')}
                name="context"
                required
                rows={4}
                defaultValue={String(item.context || '')}
              />
            </FieldFull>
            <SelectField label={t('catalog.needType')} name="needType" required defaultValue={String(item.needType || 'TECHNOLOGY')}>
              <option value="TECHNOLOGY">{t('catalog.needTechnology')}</option>
              <option value="KNOWLEDGE">{t('catalog.needKnowledge')}</option>
              <option value="PARTNERSHIP">{t('catalog.needPartnership')}</option>
              <option value="FUNDING">{t('catalog.needFunding')}</option>
              <option value="TRAINING">{t('catalog.needTraining')}</option>
              <option value="RESEARCH">{t('catalog.needResearch')}</option>
              <option value="EQUIPMENT">{t('catalog.needEquipment')}</option>
            </SelectField>
            <RegionCountryFields
              defaultRegion={String(item.region || 'south_america')}
              defaultCountry={String(item.country || 'BR')}
            />
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
