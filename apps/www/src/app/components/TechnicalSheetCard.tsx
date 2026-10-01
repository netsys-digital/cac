import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Technology } from '../api/catalogApi';

const REGION_KEYS: Record<string, string> = {
  africa: 'offerLanding.regionAfrica',
  asia: 'offerLanding.regionAsia',
  europe: 'offerLanding.regionEurope',
  north_america: 'offerLanding.regionNorthAmerica',
  south_america: 'offerLanding.regionSouthAmerica',
  oceania: 'offerLanding.regionOceania',
};

const LONG_TEXT_LIMIT = 220;
const BR_STATE_COUNT = 27;

function countryName(code: string, lang: string) {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function splitList(raw: string) {
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function Fact({ icon, label, value, wide }: { icon: string; label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div
      className={`flex items-start gap-2.5 rounded-[12px] border border-cac-line/70 bg-[#f6faf8] px-3 py-2.5 ${
        wide ? 'col-span-2' : ''
      }`}
    >
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cac-green3 text-cac-green">
        <i className={`${icon} text-[0.8rem]`} aria-hidden />
      </span>
      <div className="min-w-0">
        <dt className="text-[0.65rem] font-bold tracking-[1px] text-cac-muted uppercase">{label}</dt>
        <dd className="mt-0.5 text-pequena leading-snug font-bold break-words text-cac-navy">{value}</dd>
      </div>
    </div>
  );
}

function Block({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <section className="border-t border-cac-line/70 pt-4">
      <h4 className="flex items-center gap-2 text-mini font-bold tracking-[1.2px] text-cac-muted uppercase">
        <i className={`${icon} text-[0.8rem] text-cac-green`} aria-hidden />
        {label}
      </h4>
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ExpandableText({ text }: { text: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const long = text.length > LONG_TEXT_LIMIT;
  return (
    <>
      <p
        className={`text-pequena leading-relaxed whitespace-pre-line text-cac-ink/85 ${
          long && !open ? 'line-clamp-4' : ''
        }`}
      >
        {text}
      </p>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1 text-mini font-bold text-cac-green hover:underline"
        >
          {open ? t('detail.sheet.less') : t('detail.sheet.more')}
        </button>
      ) : null}
    </>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-cac-green/25 bg-cac-green3 px-2.5 py-1 text-mini font-bold text-cac-green">
      {children}
    </span>
  );
}

/** Ficha técnica da solução no painel lateral da página de detalhe. */
export function TechnicalSheetCard({ item }: { item: Technology }) {
  const { t, i18n } = useTranslation();
  const keywords = item.keywords ?? [];
  const partners = item.developedWithPartners && item.partnerInstitutions ? splitList(item.partnerInstitutions) : [];
  const region = item.region
    ? REGION_KEYS[item.region]
      ? t(REGION_KEYS[item.region])
      : item.region.replace(/_/g, ' ')
    : null;

  const facts: { icon: string; label: string; value: string; wide?: boolean }[] = [];
  if (item.launchYear) facts.push({ icon: 'fa-solid fa-calendar', label: t('detail.sheet.launchYear'), value: String(item.launchYear) });
  if (region) facts.push({ icon: 'fa-solid fa-earth-americas', label: t('detail.sheet.region'), value: region });
  if (item.country) facts.push({ icon: 'fa-solid fa-flag', label: t('detail.sheet.country'), value: countryName(item.country, i18n.language) });
  if (item.state && item.country?.toUpperCase() === 'BR') {
    const states = splitList(item.state);
    const value = states.length >= BR_STATE_COUNT ? t('detail.sheet.allStates') : states.join(', ');
    facts.push({ icon: 'fa-solid fa-location-dot', label: t('detail.sheet.state'), value, wide: value.length > 18 });
  }
  if (item.biome) facts.push({ icon: 'fa-solid fa-leaf', label: t('detail.sheet.biome'), value: item.biome, wide: item.biome.length > 18 });
  if (item.responsibleUnit) facts.push({ icon: 'fa-solid fa-building', label: t('detail.sheet.responsibleUnit'), value: item.responsibleUnit, wide: true });
  // Grade de 2 colunas: um item curto sobrando no fim ocupa a linha inteira.
  const shortCount = facts.filter((f) => !f.wide).length;
  if (shortCount % 2 === 1) {
    const lastShort = [...facts].reverse().find((f) => !f.wide);
    if (lastShort) lastShort.wide = true;
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-cac-line bg-white shadow-[0_10px_28px_rgba(10,36,64,.06)]">
      <header className="flex items-center gap-3 bg-[linear-gradient(145deg,#0a2440,#1a4d4a)] px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#90d6b6]/15 text-[#90d6b6] ring-1 ring-[#90d6b6]/30">
          <i className="fa-solid fa-clipboard-list text-[1.05rem]" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-mini font-bold tracking-[1.4px] text-[#90d6b6] uppercase">{t('detail.sheet.title')}</p>
          <p className="truncate text-pequena font-bold text-white">{item.title}</p>
        </div>
      </header>

      <div className="space-y-4 p-5">
        {item.developedWithPartners != null ? (
          <div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-mini font-bold ${
                item.developedWithPartners
                  ? 'bg-cac-green3 text-cac-green'
                  : 'bg-[#eef2f5] text-cac-muted'
              }`}
            >
              <i
                className={`fa-solid ${item.developedWithPartners ? 'fa-handshake' : 'fa-user'} text-[0.75rem]`}
                aria-hidden
              />
              {item.developedWithPartners ? t('detail.sheet.withPartners') : t('detail.sheet.withoutPartners')}
            </span>
            {partners.length ? (
              <div className="mt-3">
                <p className="text-[0.65rem] font-bold tracking-[1px] text-cac-muted uppercase">
                  {t('detail.sheet.partnerInstitutions')}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {partners.map((p) => (
                    <span
                      key={p}
                      className="rounded-lg border border-cac-line bg-white px-2 py-1 text-mini font-bold text-cac-navy"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {facts.length ? (
          <dl className="grid grid-cols-2 gap-2">
            {facts.map((f) => (
              <Fact key={f.label} icon={f.icon} label={f.label} value={f.value} wide={f.wide} />
            ))}
          </dl>
        ) : null}

        {item.methodology ? (
          <Block icon="fa-solid fa-flask" label={t('detail.sheet.methodology')}>
            <ExpandableText text={item.methodology} />
          </Block>
        ) : null}

        {item.accessInfo ? (
          <Block icon="fa-solid fa-signs-post" label={t('detail.sheet.accessInfo')}>
            <ExpandableText text={item.accessInfo} />
          </Block>
        ) : null}

        {keywords.length ? (
          <Block icon="fa-solid fa-tags" label={t('detail.sheet.keywords')}>
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((kw) => (
                <Tag key={kw}>{kw}</Tag>
              ))}
            </div>
          </Block>
        ) : null}

        {item.officialUrl ? (
          <a
            href={item.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-cac-green2 px-4 py-3 text-pequena font-bold text-white transition hover:brightness-105"
          >
            {t('detail.sheet.officialUrl')}
            <i className="fa-solid fa-arrow-up-right-from-square text-[0.8rem]" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}
