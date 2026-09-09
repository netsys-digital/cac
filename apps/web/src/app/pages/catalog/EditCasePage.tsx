import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Input, TextArea } from '@cac/ui';
import { useAuth } from '../../auth/AuthContext';
import { myContentsApi } from '../../api/myContentsApi';
import { FieldFull, FormPage } from '../../components/forms/FormPage';

export function EditCasePage() {
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
    try {
      if (String(item?.status) === 'PUBLISHED') {
        await myContentsApi.withdraw(accessToken, 'SUCCESS_CASE', id);
      }
      const needs = String(form.get('needs') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((needType) => ({ needType, detail: '' }));
      const evidenceNotes = String(form.get('evidence') || '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      await myContentsApi.patchCase(accessToken, id, {
        title: String(form.get('title')),
        summary: String(form.get('summary')),
        context: String(form.get('context') || ''),
        outcomes: String(form.get('outcomes') || ''),
        country: String(form.get('country') || 'MZ'),
        needs,
        evidenceNotes,
      });
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
        <TextArea label={t('catalog.summary')} name="summary" required rows={3} defaultValue={String(item.summary)} />
      </FieldFull>
      <FieldFull>
        <TextArea label={t('catalog.context')} name="context" rows={4} defaultValue={String(item.context || '')} />
      </FieldFull>
      <FieldFull>
        <TextArea label={t('catalog.outcomes')} name="outcomes" rows={3} defaultValue={String(item.outcomes || '')} />
      </FieldFull>
      <Input label={t('catalog.country')} name="country" defaultValue={String(item.country || 'MZ')} />
      <Input label={t('catalog.needs')} name="needs" defaultValue={String(item.needs || '')} />
      <FieldFull>
        <TextArea label={t('catalog.evidence')} name="evidence" rows={3} defaultValue={String(item.evidence || '')} />
      </FieldFull>
    </FormPage>
  );
}
