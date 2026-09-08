import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { urls } from '../../config';
import { useRepresentation } from '../auth/RepresentationContext';

type PublishGateProps = {
  children: ReactNode;
};

export function PublishGate({ children }: PublishGateProps) {
  const { t } = useTranslation();
  const { loading, canPublish, gate } = useRepresentation();

  if (loading) {
    return (
      <div className="rounded-[16px] border border-cac-line bg-white p-6 text-[12px] text-cac-muted shadow-cac">
        {t('gate.loading')}
      </div>
    );
  }

  if (canPublish) return <>{children}</>;

  return (
    <div className="mx-auto max-w-2xl overflow-hidden rounded-[19px] border border-cac-line bg-white shadow-cac">
      <div className="border-b border-cac-line bg-[#edf1f3] px-5 py-2 font-mono text-[10px] text-[#76838a]">
        climateactionconnect · {t('gate.badge')}
      </div>
      <div className="space-y-4 p-5 md:p-6">
        <p className="text-[10px] font-black tracking-[1.7px] text-cac-green uppercase">{t('gate.badge')}</p>
        <h1 className="text-[24px] font-black leading-tight text-cac-navy md:text-[28px]">
          {t('gate.title')}
        </h1>
        <p className="text-[12px] leading-relaxed text-cac-muted">{t('gate.body')}</p>
        <p className="rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
          {t('gate.rule')}
        </p>
        {gate === 'pending' ? (
          <p className="text-[11px] font-black uppercase tracking-wide text-amber-800">
            {t('gate.pending')}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            to="/org/representation"
            className="rounded-[10px] bg-cac-navy px-3 py-2 text-[11px] font-black text-white transition hover:bg-cac-green2"
          >
            {t('gate.cta')}
          </Link>
          <a
            href={urls.www}
            className="rounded-[10px] border border-cac-green bg-white px-3 py-2 text-[11px] font-black text-cac-green transition hover:bg-cac-green3"
          >
            {t('shell.portal')}
          </a>
          <Link
            to="/"
            className="rounded-[10px] border border-cac-line bg-white px-3 py-2 text-[11px] font-black text-cac-navy transition hover:bg-cac-bg"
          >
            {t('gate.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}
