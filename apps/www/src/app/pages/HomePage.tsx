import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { brand, urls } from '../../config';
import {
  IconCases,
  IconChallenge,
  IconFunding,
  IconOffer,
  IconSearch,
} from '../components/PathIcons';
import { searchParamsFromState } from '../search/searchReturn';
import { pushRecentSearch } from '../search/recentSearches';

const shell = 'mx-auto w-full max-w-[1220px] px-[22px]';

const HERO_IMG =
  'https://upload.wikimedia.org/wikipedia/commons/a/ab/Agroforestry_contour_planting.jpg';
const VIDEO_BG =
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1920&q=80';
const HIGHLIGHT_IMGS = [
  'https://upload.wikimedia.org/wikipedia/commons/3/32/The_Center_for_Regenerative_Agriculture_at_the_University_of_Missouri_recently_hosted_U.S._Department_of_Agriculture_%28USDA%29_Robert_Bonnie_in_Missouri_on_26_June_2024_-_14.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/2/22/Partnerships_for_Climate-Smart_Commodities_Success_Stories_%2820241206-USDA-NRCS-6%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/5/59/The_Center_for_Regenerative_Agriculture_at_the_University_of_Missouri_recently_hosted_U.S._Department_of_Agriculture_%28USDA%29_Robert_Bonnie_in_Missouri_on_26_June_2024_-_29.jpg',
];

const CONTENT_TYPES = [
  { value: '', labelKey: 'home.resourceAll' },
  { value: 'SOLUTION', labelKey: 'home.resourceSolution' },
  { value: 'PROJECT', labelKey: 'home.resourceProject' },
  { value: 'CHALLENGE', labelKey: 'home.resourceChallenge' },
  { value: 'FUNDER', labelKey: 'home.resourceFunder' },
  { value: 'ORGANIZATION', labelKey: 'home.resourceOrg' },
] as const;

const LOCATIONS = [
  { value: '', labelKey: 'home.locationAll' },
  { value: 'south_america', labelKey: 'home.locationSouthAmerica' },
  { value: 'africa', labelKey: 'home.locationAfrica' },
  { value: 'europe', labelKey: 'home.locationEurope' },
] as const;

function ArrowCircle({ className = '' }: { className?: string }) {
  return (
    <span
      className={`grid size-8 place-items-center rounded-full bg-cac-green3 text-cac-green transition group-hover:bg-cac-green2 group-hover:text-white ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
        <path
          d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [contentType, setContentType] = useState('');
  const [region, setRegion] = useState('');

  const tags = t('home.tags', { returnObjects: true }) as string[];
  const stats = t('home.stats', { returnObjects: true }) as Array<{ value: string; label: string }>;
  const pillars = t('home.pillars', { returnObjects: true }) as Array<{
    title: string;
    body: string;
  }>;
  const highlights = t('home.highlights', { returnObjects: true }) as Array<{
    badge: string;
    title: string;
    body: string;
    to: string;
  }>;

  const paths = [
    {
      to: '/search?contentType=SOLUTION',
      external: false,
      iconBg: 'bg-[#dff3e9]',
      icon: <IconSearch className="h-[22px] w-[22px]" />,
      title: t('home.path01'),
      body: t('home.path01Body'),
    },
    {
      to: '/funding',
      external: false,
      iconBg: 'bg-[#fff1ca]',
      icon: <IconFunding className="h-[22px] w-[22px]" />,
      title: t('home.path02'),
      body: t('home.path02Body'),
    },
    {
      to: `${urls.web}/catalog/challenges/new`,
      external: true,
      iconBg: 'bg-[#e4eff8]',
      icon: <IconChallenge className="h-[22px] w-[22px]" />,
      title: t('home.path03'),
      body: t('home.path03Body'),
    },
    {
      to: `${urls.web}/catalog/technologies/new`,
      external: true,
      iconBg: 'bg-[#e8f6ee]',
      icon: <IconOffer className="h-[22px] w-[22px]" />,
      title: t('home.path04'),
      body: t('home.path04Body'),
    },
    {
      to: '/cases',
      external: false,
      iconBg: 'bg-[#dff3e9]',
      icon: <IconCases className="h-[22px] w-[22px]" />,
      title: t('home.path05'),
      body: t('home.path05Body'),
    },
  ];

  function goSearch(q: string, opts?: { contentType?: string; region?: string; hint?: string }) {
    const trimmed = q.trim();
    const filters = {
      ...(opts?.contentType ? { contentType: opts.contentType } : contentType ? { contentType } : {}),
      ...(opts?.region ? { region: opts.region } : region ? { region } : {}),
    };
    if (trimmed) {
      pushRecentSearch({
        query: trimmed,
        hint: opts?.hint ?? t('home.recentHintDefault'),
      });
    }
    const params = searchParamsFromState(trimmed, filters);
    navigate(`/search?${params.toString()}`);
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    goSearch(query);
  }

  return (
    <>
      {/* Hero */}
      <section className="relative w-full overflow-hidden font-sans text-white">
        <div
          className="absolute inset-0 bg-cover bg-center bg-[position:center_48%]"
          style={{ backgroundImage: `url(${HERO_IMG})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(3,46,60,.79),rgba(2,58,62,.74))]"
          aria-hidden
        />
        <div className={`${shell} relative flex flex-col items-center pb-[6.5rem] pt-16 text-center sm:pt-20 md:pt-24`}>
          <p className="text-mini font-extrabold tracking-[1.5px] text-[#8ce4cc] uppercase">
            {brand.name}
          </p>
          <h1 className="mt-3 mb-0 max-w-[800px] text-extra-grande leading-[1.02] font-bold tracking-[-2px]">
            <span className="block">{t('home.headlineLine1')}</span>
            <span className="block">
              {t('home.headlineLine2Lead')}{' '}
              <span className="text-[#65dbba]">{t('home.headlineAccent')}</span>
            </span>
          </h1>
          <p className="mt-3.5 max-w-[730px] text-media leading-[1.35] font-normal text-white">
            <Trans
              i18nKey="home.support"
              components={{ strong: <strong className="font-bold" /> }}
            />
          </p>

          <form
            onSubmit={onSearch}
            className="mt-8 w-full max-w-[960px] rounded-[18px] bg-white p-1.5 shadow-[0_18px_48px_rgba(0,0,0,.28)]"
          >
            <div className="flex flex-col gap-1.5 lg:flex-row lg:items-stretch lg:gap-0">
              <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[14px] px-3.5 py-2.5 lg:py-1">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cac-green3">
                  <IconSearch className="h-[18px] w-[18px]" />
                </span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('home.searchPlaceholder')}
                  className="min-w-0 flex-1 border-0 bg-transparent text-media leading-normal text-cac-ink outline-none placeholder:text-[#6e7b82]"
                  aria-label={t('home.searchPlaceholder')}
                />
              </label>

              <span className="hidden w-px self-stretch bg-cac-line lg:block" aria-hidden />

              <label className="flex min-w-[9.5rem] flex-col justify-center gap-0.5 rounded-[14px] px-3.5 py-2 text-left hover:bg-[#f7faf8] lg:py-1.5">
                <span className="text-mini font-bold tracking-wide text-cac-muted uppercase">
                  {t('home.resourceType')}
                </span>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full cursor-pointer appearance-none border-0 bg-transparent pr-4 text-pequena font-bold text-cac-navy outline-none"
                >
                  {CONTENT_TYPES.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>
                      {t(opt.labelKey)}
                    </option>
                  ))}
                </select>
              </label>

              <span className="hidden w-px self-stretch bg-cac-line lg:block" aria-hidden />

              <label className="flex min-w-[8.5rem] flex-col justify-center gap-0.5 rounded-[14px] px-3.5 py-2 text-left hover:bg-[#f7faf8] lg:py-1.5">
                <span className="text-mini font-bold tracking-wide text-cac-muted uppercase">
                  {t('home.location')}
                </span>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full cursor-pointer appearance-none border-0 bg-transparent pr-4 text-pequena font-bold text-cac-navy outline-none"
                >
                  {LOCATIONS.map((opt) => (
                    <option key={opt.value || 'all-regions'} value={opt.value}>
                      {t(opt.labelKey)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="shrink-0 rounded-[14px] bg-cac-green2 px-6 py-3.5 text-pequena font-extrabold text-white transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cac-green lg:ml-1"
              >
                {t('home.searchCta')}
              </button>
            </div>
          </form>

          <div className="mt-5 flex max-w-[960px] flex-wrap items-center justify-center gap-2">
            <span className="text-mini font-bold tracking-wide text-[#a7ddc5] uppercase">
              {t('home.examplesLabel')}
            </span>
            {Array.isArray(tags)
              ? tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-mini text-white backdrop-blur-sm transition hover:bg-white/18"
                    onClick={() => goSearch(tag, { hint: t('home.recentHintTag') })}
                  >
                    {tag}
                  </button>
                ))
              : null}
          </div>
        </div>
      </section>

      {/* Path cards */}
      <div className={`${shell} relative z-10 -mt-14 pb-12`}>
        <div className="grid grid-cols-1 gap-3 min-[621px]:grid-cols-2 min-[981px]:grid-cols-5">
          {paths.map((path) => {
            const card = (
              <span className="group flex h-full min-h-[180px] flex-col rounded-[16px] border border-cac-line bg-white p-5 shadow-[0_14px_38px_rgba(10,36,64,.10)] transition duration-200 hover:-translate-y-[3px]">
                <span className={`mb-3 grid h-11 w-11 place-items-center rounded-full ${path.iconBg}`}>
                  {path.icon}
                </span>
                <span className="text-media leading-snug font-bold text-cac-navy">{path.title}</span>
                <span className="mt-2 flex-1 text-pequena leading-[1.35] text-cac-muted">{path.body}</span>
                <ArrowCircle className="mt-4 self-end" />
              </span>
            );
            const wrapClass = 'block h-full min-w-0';
            return path.external ? (
              <a key={path.title} href={path.to} className={wrapClass}>
                {card}
              </a>
            ) : (
              <Link key={path.title} to={path.to} className={wrapClass}>
                {card}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <section className="w-full bg-[linear-gradient(90deg,#0a2440,#0f5b49_55%,#13865a)] py-7 text-white">
        <div className={`${shell} grid grid-cols-2 gap-5 md:grid-cols-5 md:gap-3`}>
          {Array.isArray(stats)
            ? stats.map((stat) => (
                <div key={stat.label} className="text-center md:text-left">
                  <p className="text-grande font-bold leading-none text-[#63d9b8]">{stat.value}</p>
                  <p className="mt-1.5 text-mini leading-snug text-[#e0efed]">{stat.label}</p>
                </div>
              ))
            : null}
        </div>
      </section>

      {/* About CAC */}
      <section className="bg-white py-16">
        <div className={`${shell} grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]`}>
          <div>
            <p className="text-mini font-extrabold tracking-[1.4px] text-[#167f70] uppercase">
              {t('home.aboutBadge')}
            </p>
            <h2 className="mt-2 max-w-[34rem] text-grande leading-[1.08] font-bold tracking-[-0.7px] text-cac-navy">
              {t('home.aboutTitle')}
            </h2>
            <p className="mt-4 max-w-[36rem] text-media leading-relaxed text-cac-muted">
              {t('home.aboutBody')}
            </p>
            <Link
              to="/search"
              className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-cac-green2 px-5 py-3 text-pequena font-extrabold text-white transition hover:brightness-105"
            >
              {t('home.aboutCta')}
              <span aria-hidden>→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.isArray(pillars)
              ? pillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="rounded-[16px] border border-cac-line bg-[#f7faf8] p-5"
                  >
                    <p className="text-media font-bold text-cac-navy">{pillar.title}</p>
                    <p className="mt-2 text-pequena leading-[1.35] text-cac-muted">{pillar.body}</p>
                  </div>
                ))
              : null}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-cac-bg py-14">
        <div className={shell}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-grande font-bold tracking-[-0.7px] text-cac-navy">{t('home.highlightsTitle')}</h2>
            <Link
              to="/search"
              className="text-pequena font-extrabold text-cac-green transition hover:underline"
            >
              {t('home.highlightsAll')} →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.isArray(highlights)
              ? highlights.map((item, index) => (
                  <Link
                    key={item.title}
                    to={item.to}
                    className="group overflow-hidden rounded-[16px] border border-cac-line bg-white shadow-[0_10px_28px_rgba(10,36,64,.08)] transition hover:-translate-y-0.5"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={HIGHLIGHT_IMGS[index] ?? HIGHLIGHT_IMGS[0]}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                      <span className="absolute top-3 left-3 rounded-md bg-cac-green2 px-2 py-1 text-mini font-extrabold tracking-wide text-white uppercase">
                        {item.badge}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <p className="text-media font-bold text-cac-navy">{item.title}</p>
                        <p className="mt-1.5 text-pequena leading-[1.35] text-cac-muted">{item.body}</p>
                      </div>
                      <ArrowCircle className="shrink-0" />
                    </div>
                  </Link>
                ))
              : null}
          </div>
        </div>
      </section>

      {/* Video CTA */}
      <section className="relative overflow-hidden py-16 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${VIDEO_BG})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-[rgba(10,36,64,.78)]" aria-hidden />
        <div
          className={`${shell} relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center`}
        >
          <h2 className="max-w-[28rem] text-grande leading-[1.08] font-bold tracking-[-0.7px]">
            {t('home.videoTitle')}
          </h2>
          <a
            href="https://www.youtube.com/results?search_query=climate+action+solutions"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 rounded-full border-2 border-white/80 px-6 py-3.5 text-pequena font-extrabold text-white transition hover:bg-white/10"
          >
            <span className="grid size-8 place-items-center rounded-full border border-white/80" aria-hidden>
              ▶
            </span>
            {t('home.videoCta')}
          </a>
        </div>
      </section>
    </>
  );
}
