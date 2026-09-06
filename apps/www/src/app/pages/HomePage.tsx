import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { urls } from '../../config';
import { HeroLandscape } from '../components/HeroLandscape';
import {
  IconCases,
  IconChallenge,
  IconFunding,
  IconOffer,
  IconSearch,
} from '../components/PathIcons';

/** Conteúdo centralizado — classes no app para o Tailwind escanear. */
const shell = 'mx-auto w-full max-w-[1220px] px-[22px]';

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('recuperação de pastagens em seca');

  const tags = t('home.tags', { returnObjects: true }) as string[];

  const paths = [
    {
      to: '/search',
      external: false,
      icon: <IconSearch className="h-[22px] w-[22px]" />,
      title: t('home.path01'),
      body: t('home.path01Body'),
    },
    {
      to: '/funding',
      external: false,
      icon: <IconFunding className="h-[22px] w-[22px]" />,
      title: t('home.path02'),
      body: t('home.path02Body'),
    },
    {
      to: `${urls.web}/catalog/challenges/new`,
      external: true,
      icon: <IconChallenge className="h-[22px] w-[22px]" />,
      title: t('home.path03'),
      body: t('home.path03Body'),
    },
    {
      to: `${urls.web}/catalog/technologies/new`,
      external: true,
      icon: <IconOffer className="h-[22px] w-[22px]" />,
      title: t('home.path04'),
      body: t('home.path04Body'),
    },
    {
      to: '/cases',
      external: false,
      icon: <IconCases className="h-[22px] w-[22px]" />,
      title: t('home.path05'),
      body: t('home.path05Body'),
    },
  ];

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  }

  return (
    <>
      {/* Fundo da dobra: 100% da largura */}
      <section className="relative w-full min-h-[660px] overflow-hidden bg-[linear-gradient(135deg,#0a2440,#0f5b49_58%,#1b7c5b)] font-sans text-white">
        <div
          className={`${shell} grid min-h-[660px] items-center gap-8 py-10 lg:grid-cols-[1.02fr_.98fr]`}
        >
          <div className="py-6 lg:py-[70px]">
            <p className="text-[10px] font-black tracking-[1.7px] text-[#a7ddc5] uppercase">
              {t('home.kicker')}
            </p>
            <h1 className="mt-4 mb-0 max-w-[650px] text-[38px] leading-[1.02] font-black lg:text-[55px]">
              {t('home.headline')}
            </h1>
            <p className="mt-4 max-w-[640px] text-[16px] leading-[1.6] font-normal text-[#e2efeb]">
              {t('home.support')}
            </p>
            <form
              onSubmit={onSearch}
              className="mt-7 mb-3.5 flex max-w-[650px] flex-col gap-[9px] sm:flex-row sm:items-stretch"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('home.searchPlaceholder')}
                className="min-w-0 flex-1 rounded-[13px] border-0 bg-white px-[18px] py-[17px] text-[12px] leading-normal text-cac-ink shadow-[0_8px_24px_rgba(0,0,0,.12)] outline-none placeholder:text-[#6e7b82]"
              />
              <button
                type="submit"
                className="shrink-0 rounded-[10px] bg-cac-green2 px-[18px] py-[17px] text-[12px] font-black text-white transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cac-green sm:min-w-[108px]"
              >
                {t('home.searchCta')}
              </button>
            </form>
            <div className="flex flex-wrap gap-[7px]">
              {Array.isArray(tags)
                ? tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="rounded-[20px] border border-[rgba(255,255,255,.18)] bg-[rgba(255,255,255,.07)] px-[10px] py-[7px] text-[10px] text-white transition hover:bg-white/15"
                      onClick={() => {
                        setQuery(tag);
                        navigate(`/search?q=${encodeURIComponent(tag)}`);
                      }}
                    >
                      {tag}
                    </button>
                  ))
                : null}
            </div>
          </div>
          <div className="flex justify-center pb-8 lg:pb-0">
            <HeroLandscape />
          </div>
        </div>
      </section>

      {/* Cards alinhados ao mesmo eixo do header/hero */}
      <div className={`${shell} relative z-10 -mt-[54px] pb-16`}>
        <div className="grid grid-cols-1 gap-[12px] min-[621px]:grid-cols-2 min-[981px]:grid-cols-5">
          {paths.map((path) => {
            const card = (
              <span className="flex h-full min-h-[164px] flex-col rounded-[16px] border border-cac-line bg-white p-[18px] shadow-[0_14px_38px_rgba(10,36,64,.10)] transition duration-200 hover:-translate-y-[3px]">
                <span className="mb-[11px] grid h-[42px] w-[42px] place-items-center rounded-[12px] bg-cac-green3">
                  {path.icon}
                </span>
                <span className="text-[12px] leading-[1.25] font-black text-cac-navy uppercase">
                  {path.title}
                </span>
                <span className="mt-[7px] text-[10px] leading-[1.45] text-cac-muted">{path.body}</span>
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
    </>
  );
}
