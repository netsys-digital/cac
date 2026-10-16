import { type MouseEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@cac/ui';
import { FieldFull } from './FormPage';
import { RegionCountryFields } from './RegionCountryFields';

export type ApplicationPlace = {
  country: string;
  region: string;
  note: string;
};

type Props = {
  originCountry?: string;
  defaultPlaces?: ApplicationPlace[];
};

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
  const { t } = useTranslation();
  const [places, setPlaces] = useState<ApplicationPlace[]>(defaultPlaces);
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [note, setNote] = useState('');
  const [draftKey, setDraftKey] = useState(0);

  function addPlace(event: MouseEvent<HTMLButtonElement>) {
    const code = country.trim().toUpperCase();
    const form = event.currentTarget.form;
    const origin = String((form ? new FormData(form).get('country') : '') || originCountry)
      .trim()
      .toUpperCase();
    if (!region || code.length !== 2) return;
    if (origin && code === origin) return;
    if (places.some((place) => place.country === code)) return;
    setPlaces((current) => [...current, { country: code, region, note: note.trim() }]);
    setRegion('');
    setCountry('');
    setNote('');
    setDraftKey((value) => value + 1);
  }

  return (
    <FieldFull>
      <section className="space-y-3 rounded-[14px] border border-dashed border-cac-line bg-white p-3">
        <div>
          <p className="text-mini font-extrabold uppercase tracking-[0.4px] text-cac-muted">
            {t('catalog.applicationTitle')}
          </p>
          <p className="mt-1 text-mini leading-snug text-cac-muted">{t('catalog.applicationHint')}</p>
        </div>
        <input type="hidden" name="applicationPlaces" value={JSON.stringify(places)} />
        {places.length ? (
          <ul className="space-y-1.5">
            {places.map((place) => (
              <li
                key={place.country}
                className="flex items-start justify-between gap-3 rounded-lg bg-cac-bg px-3 py-2"
              >
                <span className="min-w-0 text-pequena text-cac-navy">
                  <span className="font-bold">{place.country}</span>
                  <span className="text-cac-muted"> · {place.region.replace(/_/g, ' ')}</span>
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
        <div key={draftKey} className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <RegionCountryFields
            regionName="applicationRegionDraft"
            countryName="applicationCountryDraft"
            region={region}
            country={country}
            onRegionChange={setRegion}
            onCountryChange={setCountry}
            required={false}
            regionLabel={t('catalog.applicationRegion')}
            countryLabel={t('catalog.applicationCountry')}
          />
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
          onClick={addPlace}
          className="rounded-full border border-cac-line bg-white px-3 py-1.5 text-mini font-bold text-cac-navy hover:bg-cac-bg"
        >
          {t('catalog.applicationAdd')}
        </button>
      </section>
    </FieldFull>
  );
}
