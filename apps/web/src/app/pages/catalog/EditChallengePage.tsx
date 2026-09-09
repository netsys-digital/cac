import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { myContentsApi } from '../../api/myContentsApi';
import { FieldFull, FormPage, SelectField } from '../../components/forms/FormPage';

export function EditChallengePage() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

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
    try {
      if (String(item?.status) === 'PUBLISHED') {
        await myContentsApi.withdraw(accessToken, 'CHALLENGE', id);
      }
      await myContentsApi.patchChallenge(accessToken, id, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        needType: String(form.get('needType')),
        country: String(form.get('country') || 'BR'),
      });
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
    >
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
      <SelectField label={t('catalog.needType')} name="needType" defaultValue={String(item.needType || 'TECHNOLOGY')}>
        <option value="TECHNOLOGY">{t('catalog.needTechnology')}</option>
        <option value="KNOWLEDGE">{t('catalog.needKnowledge')}</option>
        <option value="PARTNERSHIP">{t('catalog.needPartnership')}</option>
        <option value="FUNDING">{t('catalog.needFunding')}</option>
        <option value="TRAINING">{t('catalog.needTraining')}</option>
        <option value="RESEARCH">{t('catalog.needResearch')}</option>
        <option value="EQUIPMENT">{t('catalog.needEquipment')}</option>
      </SelectField>
      <Input label={t('catalog.country')} name="country" defaultValue={String(item.country || 'BR')} />
    </FormPage>
  );
}
