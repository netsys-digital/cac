import { type MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@cac/ui';
import { catalogApi } from '../../api/catalogApi';
import { countryCodesForRegion } from '../../lib/regionCountries';
import { FieldFull } from './FormPage';
import { RegionCountryFields, type DomainOption } from './RegionCountryFields';

export type ApplicationPlace = {
  country: string;
  region: string;
  note: string;
};

type DraftPlace = {
  country: string;
  region: string;
};

type Props = {
  originCountry?: string;
  defaultPlaces?: ApplicationPlace[];
};

function labelFor(item: DomainOption, lang: string) {
  if (lang.startsWith('en') || lang.startsWith('es')) return item.labelEn;
  return item.labelPt;
}

export function pickApplicationPlaces(form: FormData): ApplicationPlace[] {
  const raw = String(form.get('applicationPlaces') || '').trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return [];
      const place = item as Partial<ApplicationPlace>;
      const country = String(place.country || '').trim().toUpperCase();
      const region = String(place.region || '').trim();
      if (country.length !== 2 || !region) return [];
      return [{ country, region, note: String(place.note || '').trim() }];
    });
  } catch {
    return [];
  }
}

export function placesFromUnknown(value: unknown): ApplicationPlace[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const place = item as Partial<ApplicationPlace>;
    const country = String(place.country || '').trim().toUpperCase();
    const region = String(place.region || '').trim();
    if (country.length !== 2) return [];
    return [{ country, region, note: String(place.note || '').trim() }];
  });
}

/** Países onde a mesma publicação se aplica, além do país de origem. */
export function ApplicationPlacesField({ originCountry = '', defaultPlaces = [] }: Props) {
  const { t, i18n } = useTranslation();
  const selectAllRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [places, setPlaces] = useState<ApplicationPlace[]>(defaultPlaces);
  const [region, setRegion] = useState('');
  const [liveOrigin, setLiveOrigin] = useState(originCountry.trim().toUpperCase());
  const [picked, setPicked] = useState<DraftPlace[]>([]);
  const [note, setNote] = useState('');
  const [countries, setCountries] = useState<DomainOption[]>([]);
  const [regions, setRegions] = useState<DomainOption[]>([]);

  useEffect(() => {
    void Promise.all([catalogApi.listDomains('country'), catalogApi.listDomains('region')]).then(
      ([countryRes, regionRes]) => {
        setCountries(countryRes.items);
        setRegions(regionRes.items);
      },
    );
  }, []);

  useEffect(() => {
    setLiveOrigin(originCountry.trim().toUpperCase());
  }, [originCountry]);

  useEffect(() => {
    const select = sectionRef.current?.closest('form')?.querySelector<HTMLSelectElement>('select[name="country"]');
    if (!select) return;
    const sync = () => setLiveOrigin(select.value.trim().toUpperCase());
    sync();
    select.addEventListener('change', sync);
    return () => select.removeEventListener('change', sync);
  }, [region]);

  const listed = useMemo(() => {
    if (!region) return [];
    const allowed = countryCodesForRegion(region);
    const rows = allowed ? countries.filter((item) => allowed.has(item.key.toUpperCase())) : countries;
    return [...rows].sort((a, b) => labelFor(a, i18n.language).localeCompare(labelFor(b, i18n.language), i18n.language));
  }, [countries, region, i18n.language]);

  const included = useMemo(() => new Set(places.map((place) => place.country)), [places]);
  const pickedCodes = useMemo(() => new Set(picked.map((place) => place.country)), [picked]);

  const addable = useMemo(
    () =>
      listed
        .map((item) => item.key.toUpperCase())
        .filter((code) => code !== liveOrigin && !included.has(code)),
    [listed, liveOrigin, included],
  );
  const listedCodes = useMemo(
    () => listed.map((item) => item.key.toUpperCase()).filter((code) => code !== liveOrigin),
    [listed, liveOrigin],
  );
  const coveredCount = listedCodes.filter((code) => included.has(code) || pickedCodes.has(code)).length;
  const allChecked = addable.length > 0 && addable.every((code) => pickedCodes.has(code));
  const someChecked = addable.some((code) => pickedCodes.has(code)) && !allChecked;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someChecked;
  }, [someChecked, region, addable.length]);

  function toggleCountry(code: string) {
    setPicked((current) => {
      if (current.some((place) => place.country === code)) {
        return current.filter((place) => place.country !== code);
      }
      return [...current, { country: code, region }];
    });
  }

  function toggleAll() {
    setPicked((current) => {
      const rest = current.filter((place) => !addable.includes(place.country));
      if (allChecked) return rest;
      const already = new Set(rest.map((place) => place.country));
      return [
        ...rest,
        ...addable.filter((code) => !already.has(code)).map((country) => ({ country, region })),
      ];
    });
  }

  function addPlaces(event: MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    const origin = String((form ? new FormData(form).get('country') : '') || originCountry)
      .trim()
      .toUpperCase();
    const noteText = note.trim();
    setPlaces((current) => {
      const seen = new Set(current.map((place) => place.country));
      const next = [...current];
      for (const place of picked) {
        if (!place.country || place.country === origin || seen.has(place.country)) continue;
        seen.add(place.country);
        next.push({ country: place.country, region: place.region, note: noteText });
      }
      return next;
    });
    setPicked([]);
    setNote('');
  }

  function placeName(code: string) {
    const item = countries.find((country) => country.key.toUpperCase() === code);
    return item ? labelFor(item, i18n.language) : code;
  }

  function regionName(key: string) {
    const item = regions.find((regionItem) => regionItem.key === key);
    return item ? labelFor(item, i18n.language) : key.replace(/_/g, ' ');
  }

  return (
    <FieldFull>
      <section ref={sectionRef} className="space-y-3 rounded-[14px] border border-dashed border-cac-line bg-white p-3">
        <div>
          <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
            {t('catalog.applicationTitle')}
          </p>
          <p className="mt-1 text-mini leading-snug text-cac-muted">{t('catalog.applicationHint')}</p>
        </div>
        <input type="hidden" name="applicationPlaces" value={JSON.stringify(places)} />
        {places.length ? (
          <ul className="max-h-48 space-y-1.5 overflow-y-auto">
            {places.map((place) => (
              <li
                key={place.country}
                className="flex items-start justify-between gap-3 rounded-lg bg-cac-bg px-3 py-2"
              >
                <span className="min-w-0 text-pequena text-cac-navy">
                  <span className="font-bold">{placeName(place.country)}</span>
                  <span className="text-cac-muted"> · {regionName(place.region)}</span>
                  {place.note ? <span className="mt-0.5 block text-mini text-cac-muted">{place.note}</span> : null}
                </span>
                <button
                  type="button"
                  className="shrink-0 text-mini font-bold text-cac-green"
                  onClick={() => setPlaces((current) => current.filter((item) => item.country !== place.country))}
                >
                  {t('catalog.applicationRemove')}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-mini text-cac-muted">{t('catalog.applicationEmpty')}</p>
        )}
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <FieldFull>
            <RegionCountryFields
              regionName="applicationRegionDraft"
              countryName="applicationCountryDraft"
              region={region}
              onRegionChange={setRegion}
              required={false}
              hideCountry
              regionLabel={t('catalog.applicationRegion')}
              regionHint={t('catalog.applicationRegionHint')}
            />
          </FieldFull>
          <FieldFull>
            {region ? (
              <div className="overflow-hidden rounded-[12px] border border-cac-line bg-white">
                <label className="flex cursor-pointer items-center gap-2.5 border-b border-cac-line bg-[#f6faf8] px-3 py-2 text-pequena font-bold text-cac-navy hover:bg-cac-green3/60">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={listed.length > 0 && (addable.length === 0 || allChecked)}
                    disabled={listed.length === 0 || addable.length === 0}
                    onChange={toggleAll}
                    className="size-4 shrink-0 accent-cac-green"
                  />
                  {t('catalog.applicationSelectAll')}
                  <span className="ml-auto text-mini font-semibold text-cac-muted">
                    {coveredCount}/{listedCodes.length}
                  </span>
                </label>
                <ul className="max-h-60 overflow-y-auto py-1" aria-label={t('catalog.applicationCountry')}>
                  {listed.map((item) => {
                    const code = item.key.toUpperCase();
                    const isOrigin = code === liveOrigin;
                    if (isOrigin) return null;
                    const saved = included.has(code);
                    const checked = saved || pickedCodes.has(code);
                    return (
                      <li key={item.id}>
                        <label
                          className={`flex items-center gap-2.5 px-3 py-1.5 text-pequena ${
                            saved ? 'cursor-default text-cac-muted' : 'cursor-pointer text-cac-navy hover:bg-[#f3f6f8]'
                          } ${checked && !saved ? 'bg-cac-green3/50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={saved}
                            onChange={() => toggleCountry(code)}
                            className="size-4 shrink-0 accent-cac-green"
                          />
                          <span className="min-w-0 flex-1 truncate">{labelFor(item, i18n.language)}</span>
                          <span className="text-mini font-bold text-cac-muted">{code}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <p className="text-mini text-cac-muted">{t('catalog.countryHintNeedRegion')}</p>
            )}
          </FieldFull>
          <FieldFull>
            <Input
              label={t('catalog.applicationNote')}
              hint={t('catalog.applicationNoteHint')}
              name="applicationNoteDraft"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </FieldFull>
        </div>
        <button
          type="button"
          onClick={addPlaces}
          disabled={picked.length === 0}
          className="rounded-full border border-cac-line bg-white px-3 py-1.5 text-mini font-bold text-cac-navy hover:bg-cac-bg disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t('catalog.applicationAdd')}
          {picked.length ? ` · ${t('catalog.applicationSelected', { count: picked.length })}` : ''}
        </button>
      </section>
    </FieldFull>
  );
}
