import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  return (
    <div>
      <p className="text-[10px] font-black tracking-[1.7px] text-cac-green uppercase">
        {t('shell.signedIn')}
      </p>
      <h1 className="mt-2 text-[32px] leading-tight font-black text-cac-navy">
        {t('shell.welcome', { name: user?.name ?? '' })}
      </h1>
      <div className="mt-6 rounded-2xl border border-cac-line bg-white p-[18px] shadow-cac">
        <p className="text-[11px] text-cac-muted">{user?.email}</p>
        <p className="mt-1 text-[12px] font-black text-cac-green uppercase">{user?.role}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/org/representation"
            className="rounded-[10px] bg-cac-green3 px-3 py-2 text-[11px] font-black text-cac-navy"
          >
            {t('nav.representation')}
          </Link>
          <Link
            to="/catalog/technologies/new"
            className="rounded-[10px] bg-cac-green3 px-3 py-2 text-[11px] font-black text-cac-navy"
          >
            {t('nav.newTech')}
          </Link>
          <Link
            to="/catalog/challenges/new"
            className="rounded-[10px] bg-cac-green3 px-3 py-2 text-[11px] font-black text-cac-navy"
          >
            {t('nav.newChallenge')}
          </Link>
        </div>
      </div>
    </div>
  );
}
