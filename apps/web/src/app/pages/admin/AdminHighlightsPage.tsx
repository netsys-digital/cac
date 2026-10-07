import { type DragEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@cac/ui';
import { urls } from '../../../config';
import { useAuth } from '../../auth/AuthContext';
import { catalogApi, type HighlightItem, type HighlightType } from '../../api/catalogApi';
import { resolveMediaUrl } from '../../components/forms/RepresentativeImageField';

const TYPE_FILTERS: Array<HighlightType | ''> = ['', 'SOLUTION', 'FUNDING_OFFER', 'SUCCESS_CASE'];

const TYPE_STYLES: Record<HighlightType, string> = {
  SOLUTION: 'bg-[#dff3e9] text-[#13865a]',
  FUNDING_OFFER: 'bg-[#fff1ca] text-[#9a6b0b]',
  SUCCESS_CASE: 'bg-[#e4eff8] text-[#2d6e9f]',
};

const PUBLIC_PATH: Record<HighlightType, string> = {
  SOLUTION: '/solutions',
  FUNDING_OFFER: '/funding',
  SUCCESS_CASE: '/cases',
};

type DragOrigin = 'selected' | 'available';

const keyOf = (item: Pick<HighlightItem, 'type' | 'id'>) => `${item.type}:${item.id}`;

function displayTitle(item: HighlightItem) {
  return item.cardTitle?.trim() || item.title;
}

function displayImage(item: HighlightItem) {
  return resolveMediaUrl(item.cardImageUrl || item.coverImageUrl);
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-cac-muted/70" fill="currentColor" aria-hidden>
      <circle cx="5.5" cy="3.5" r="1.3" />
      <circle cx="10.5" cy="3.5" r="1.3" />
      <circle cx="5.5" cy="8" r="1.3" />
      <circle cx="10.5" cy="8" r="1.3" />
      <circle cx="5.5" cy="12.5" r="1.3" />
      <circle cx="10.5" cy="12.5" r="1.3" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`size-3.5 ${direction === 'down' ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <path d="M8 13V3M4 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminHighlightsPage() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const [max, setMax] = useState(6);
  const [selected, setSelected] = useState<HighlightItem[]>([]);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [pool, setPool] = useState<HighlightItem[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<HighlightType | ''>('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [drag, setDrag] = useState<{ item: HighlightItem; origin: DragOrigin } | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [overPool, setOverPool] = useState(false);

  const apply = useCallback((payload: { max: number; selected: HighlightItem[]; available: HighlightItem[] }) => {
    setMax(payload.max);
    setSelected(payload.selected);
    setSavedKeys(payload.selected.map(keyOf));
    setPool([...payload.selected, ...payload.available]);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    catalogApi
      .getHighlights(accessToken)
      .then(apply)
      .catch((e) => setError(e instanceof Error ? e.message : t('admin.highlightsError')))
      .finally(() => setLoading(false));
  }, [accessToken, apply, t]);

  const selectedKeys = useMemo(() => new Set(selected.map(keyOf)), [selected]);
  const dirty = selected.map(keyOf).join('|') !== savedKeys.join('|');
  const full = selected.length >= max;

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pool.filter((item) => {
      if (selectedKeys.has(keyOf(item))) return false;
      if (typeFilter && item.type !== typeFilter) return false;
      if (!q) return true;
      return [item.title, item.cardTitle, item.organizationName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [pool, selectedKeys, typeFilter, query]);

  function move(index: number, delta: number) {
    setSelected((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setMessage('');
  }

  function add(item: HighlightItem) {
    if (full) return;
    setSelected((list) => [...list, item]);
    setMessage('');
  }

  function remove(item: HighlightItem) {
    setSelected((list) => list.filter((entry) => keyOf(entry) !== keyOf(item)));
    setMessage('');
  }

  /** Insere (ou move) o item na posição `index` da lista de destaques. */
  function placeAt(item: HighlightItem, index: number) {
    setSelected((list) => {
      const key = keyOf(item);
      const from = list.findIndex((entry) => keyOf(entry) === key);
      if (from < 0 && list.length >= max) return list;
      const next = list.filter((entry) => keyOf(entry) !== key);
      const target = from >= 0 && from < index ? index - 1 : index;
      next.splice(Math.max(0, Math.min(target, next.length)), 0, item);
      return next;
    });
    setMessage('');
  }

  function startDrag(event: DragEvent, item: HighlightItem, origin: DragOrigin) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', keyOf(item));
    // Chrome cancela o drag se o DOM do item mudar no mesmo tick do dragstart.
    window.setTimeout(() => setDrag({ item, origin }), 0);
  }

  function endDrag() {
    setDrag(null);
    setDropIndex(null);
    setOverPool(false);
  }

  function overSelectedItem(event: DragEvent<HTMLLIElement>, index: number) {
    if (!drag) return;
    if (drag.origin === 'available' && full) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    setDropIndex(after ? index + 1 : index);
  }

  function overSelectedList(event: DragEvent) {
    if (!drag) return;
    if (drag.origin === 'available' && full) return;
    event.preventDefault();
    if (dropIndex === null) setDropIndex(selected.length);
  }

  function dropOnSelected(event: DragEvent) {
    event.preventDefault();
    if (drag) placeAt(drag.item, dropIndex ?? selected.length);
    endDrag();
  }

  function dropOnPool(event: DragEvent) {
    event.preventDefault();
    if (drag?.origin === 'selected') remove(drag.item);
    endDrag();
  }

  const acceptsDrop = Boolean(drag) && !(drag?.origin === 'available' && full);

  async function onSave() {
    if (!accessToken) return;
    setBusy(true);
    setError('');
    try {
      const payload = await catalogApi.saveHighlights(
        accessToken,
        selected.map((item) => ({ type: item.type, id: item.id })),
      );
      apply(payload);
      setMessage(t('admin.highlightsSaved'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.highlightsError'));
    } finally {
      setBusy(false);
    }
  }

  const typeLabel = (type: HighlightType) => t(`admin.highlightsType.${type}`);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-cac-line bg-white p-5 shadow-cac">
        <div className="max-w-[44rem]">
          <p className="text-pequena font-extrabold tracking-[0.12em] text-cac-green uppercase">
            {t('admin.highlightsEyebrow')}
          </p>
          <h1 className="mt-1 text-grande font-bold text-cac-navy">{t('admin.highlightsTitle')}</h1>
          <p className="mt-1.5 text-pequena leading-snug text-cac-muted">{t('admin.highlightsDesc')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={urls.www}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-xl border border-cac-line bg-white px-4 py-2.5 text-pequena font-extrabold text-cac-navy transition hover:bg-[#f7faf8]"
          >
            {t('admin.highlightsViewHome')} ↗
          </a>
          <Button type="button" disabled={!dirty || busy} onClick={() => void onSave()}>
            {busy ? t('common.working') : t('admin.highlightsSave')}
          </Button>
        </div>
      </header>

      {message ? (
        <p className="rounded-xl border border-cac-line bg-cac-green3/40 px-4 py-3 text-media font-semibold text-cac-navy">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-media font-semibold text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-pequena text-cac-muted">{t('mine.loading')}</p>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <section
            onDragOver={overSelectedList}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropIndex(null);
            }}
            onDrop={dropOnSelected}
            className={`flex flex-col space-y-3 rounded-[16px] border bg-cac-green3/30 p-4 shadow-cac transition md:p-5 ${
              acceptsDrop && drag?.origin === 'available'
                ? 'border-cac-green ring-2 ring-cac-green/30'
                : 'border-cac-green/30'
            }`}
          >
            <header className="flex items-start justify-between gap-3 border-b border-cac-green/20 pb-3">
              <div>
                <p className="text-mini font-extrabold tracking-[1.7px] text-cac-green uppercase">
                  {t('admin.highlightsSelected')}
                </p>
                <p className="mt-1 text-mini leading-snug text-cac-muted">{t('admin.highlightsSelectedHint')}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-mini font-extrabold text-cac-navy">
                {selected.length}/{max}
              </span>
            </header>

            {selected.length ? (
              <ol className="flex-1 space-y-2">
                {selected.map((item, index) => {
                  const image = displayImage(item);
                  const dragging = drag && keyOf(drag.item) === keyOf(item);
                  const lineTop = acceptsDrop && dropIndex === index;
                  const lineBottom = acceptsDrop && index === selected.length - 1 && dropIndex === selected.length;
                  return (
                    <li
                      key={keyOf(item)}
                      draggable
                      onDragStart={(e) => startDrag(e, item, 'selected')}
                      onDragEnd={endDrag}
                      onDragOver={(e) => overSelectedItem(e, index)}
                      style={{
                        boxShadow: lineTop
                          ? '0 -4px 0 0 #13865a'
                          : lineBottom
                            ? '0 4px 0 0 #13865a'
                            : undefined,
                      }}
                      className={`flex cursor-grab items-center gap-3 rounded-[14px] border border-cac-line bg-white p-2.5 shadow-[0_6px_16px_rgba(10,36,64,.06)] transition active:cursor-grabbing ${
                        dragging ? 'opacity-40' : ''
                      }`}
                    >
                      <GripIcon />
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cac-navy text-mini font-extrabold text-white">
                        {index + 1}
                      </span>
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-[10px] bg-gradient-to-br from-[#b8d7bf] to-[#dce9d3]">
                        {image ? (
                          <img src={image} alt="" draggable={false} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-pequena font-bold text-cac-navy">{displayTitle(item)}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-mini text-cac-muted">
                          <span className={`rounded-md px-1.5 py-0.5 font-extrabold ${TYPE_STYLES[item.type]}`}>
                            {typeLabel(item.type)}
                          </span>
                          {item.organizationName ? <span className="truncate">{item.organizationName}</span> : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label={t('admin.highlightsMoveUp')}
                          title={t('admin.highlightsMoveUp')}
                          disabled={index === 0}
                          onClick={() => move(index, -1)}
                          className="grid size-8 place-items-center rounded-lg border border-cac-line text-cac-navy transition hover:bg-cac-green3 disabled:opacity-35"
                        >
                          <ArrowIcon direction="up" />
                        </button>
                        <button
                          type="button"
                          aria-label={t('admin.highlightsMoveDown')}
                          title={t('admin.highlightsMoveDown')}
                          disabled={index === selected.length - 1}
                          onClick={() => move(index, 1)}
                          className="grid size-8 place-items-center rounded-lg border border-cac-line text-cac-navy transition hover:bg-cac-green3 disabled:opacity-35"
                        >
                          <ArrowIcon direction="down" />
                        </button>
                        <button
                          type="button"
                          aria-label={t('admin.highlightsRemove')}
                          title={t('admin.highlightsRemove')}
                          onClick={() => remove(item)}
                          className="grid size-8 place-items-center rounded-lg border border-red-200 text-red-700 transition hover:bg-red-50"
                        >
                          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                            <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p
                className={`rounded-[12px] border border-dashed px-4 py-6 text-center text-pequena text-cac-muted transition ${
                  acceptsDrop ? 'border-cac-green bg-white' : 'border-cac-green/40 bg-white/70'
                }`}
              >
                {acceptsDrop ? t('admin.highlightsDropHere') : t('admin.highlightsEmpty')}
              </p>
            )}
            {selected.length && drag?.origin === 'available' && acceptsDrop ? (
              <p
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDropIndex(selected.length);
                }}
                className="rounded-[12px] border border-dashed border-cac-green bg-white px-4 py-3 text-center text-mini font-semibold text-cac-green"
              >
                {t('admin.highlightsDropHere')}
              </p>
            ) : null}
          </section>

          <section
            onDragOver={(e) => {
              if (drag?.origin !== 'selected') return;
              e.preventDefault();
              setOverPool(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverPool(false);
            }}
            onDrop={dropOnPool}
            className={`relative space-y-3 rounded-[16px] border bg-white p-4 shadow-cac transition md:p-5 ${
              drag?.origin === 'selected'
                ? overPool
                  ? 'border-red-300 ring-2 ring-red-200'
                  : 'border-dashed border-red-200'
                : 'border-cac-line'
            }`}
          >
            {drag?.origin === 'selected' ? (
              <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[16px] bg-white/80 backdrop-blur-[1px]">
                <p className="rounded-full bg-red-50 px-4 py-2 text-pequena font-extrabold text-red-700">
                  {t('admin.highlightsDropRemove')}
                </p>
              </div>
            ) : null}
            <header className="space-y-3 border-b border-cac-line pb-3">
              <div>
                <p className="text-mini font-extrabold tracking-[1.7px] text-cac-navy uppercase">
                  {t('admin.highlightsAvailable')}
                </p>
                <p className="mt-1 text-mini leading-snug text-cac-muted">{t('admin.highlightsAvailableHint')}</p>
              </div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('admin.highlightsSearch')}
                className="w-full rounded-xl border border-cac-line bg-white px-3.5 py-2.5 text-pequena text-cac-navy outline-none focus:border-cac-green"
              />
              <div className="flex flex-wrap gap-1.5">
                {TYPE_FILTERS.map((type) => (
                  <button
                    key={type || 'all'}
                    type="button"
                    onClick={() => setTypeFilter(type)}
                    className={`rounded-full px-3 py-1.5 text-mini font-extrabold transition ${
                      typeFilter === type
                        ? 'bg-cac-navy text-white'
                        : 'border border-cac-line bg-white text-cac-navy hover:bg-[#f7faf8]'
                    }`}
                  >
                    {type ? typeLabel(type) : t('admin.highlightsAll')}
                  </button>
                ))}
              </div>
            </header>

            {full ? (
              <p className="rounded-lg bg-[#fff6dd] px-3 py-2 text-mini font-semibold text-[#8a5a00]">
                {t('admin.highlightsFull', { max })}
              </p>
            ) : null}

            {available.length ? (
              <ul className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                {available.map((item) => {
                  const image = displayImage(item);
                  return (
                    <li
                      key={keyOf(item)}
                      draggable={!full}
                      onDragStart={(e) => startDrag(e, item, 'available')}
                      onDragEnd={endDrag}
                      className={`flex items-center gap-3 rounded-[14px] border border-cac-line bg-[#fbfcfb] p-2.5 transition ${
                        full ? '' : 'cursor-grab hover:border-cac-green/40 active:cursor-grabbing'
                      } ${drag && keyOf(drag.item) === keyOf(item) ? 'opacity-40' : ''}`}
                    >
                      {full ? null : <GripIcon />}
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-[10px] bg-gradient-to-br from-[#b8d7bf] to-[#dce9d3]">
                        {image ? (
                          <img src={image} alt="" draggable={false} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <a
                          draggable={false}
                          href={`${urls.www}${PUBLIC_PATH[item.type]}/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-pequena font-bold text-cac-navy hover:text-cac-green"
                        >
                          {displayTitle(item)}
                        </a>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-mini text-cac-muted">
                          <span className={`rounded-md px-1.5 py-0.5 font-extrabold ${TYPE_STYLES[item.type]}`}>
                            {typeLabel(item.type)}
                          </span>
                          {item.organizationName ? <span className="truncate">{item.organizationName}</span> : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={full}
                        onClick={() => add(item)}
                        className="shrink-0 rounded-[10px] bg-cac-green2 px-3 py-2 text-mini font-extrabold text-white transition hover:brightness-105 disabled:opacity-40"
                      >
                        {t('admin.highlightsAdd')}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-[12px] border border-dashed border-cac-line px-4 py-6 text-center text-pequena text-cac-muted">
                {t('admin.highlightsNoneAvailable')}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
