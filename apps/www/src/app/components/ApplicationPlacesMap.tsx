import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { centroidFor } from '../lib/countryCentroids';

type Place = {
  country: string;
  region?: string | null;
  note?: string | null;
};

const REGION_ORDER = [
  'africa',
  'asia',
  'europe',
  'middle_east',
  'north_america',
  'latam',
  'south_america',
  'oceania',
  'global',
];

const pointIcon = L.divIcon({
  className: 'cac-cluster-icon',
  html: '<span style="display:block;width:14px;height:14px;border-radius:999px;background:#1f9d63;box-shadow:0 0 0 2px #fff,0 2px 6px rgba(10,36,64,.28);"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const originIcon = L.divIcon({
  className: 'cac-cluster-icon',
  html: '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path fill="#f0b429" stroke="#fff" stroke-width="1.6" stroke-linejoin="round" d="M12 1.7l2.95 6.35 6.95.7-5.2 4.7 1.55 6.8L12 16.7 5.75 20.25l1.55-6.8-5.2-4.7 6.95-.7z"/></svg>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function FitPlaces({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  const { t } = useTranslation();
  const signature = points.map((point) => point.join(',')).join('|');

  useEffect(() => {
    const fit = () => {
      map.invalidateSize({ animate: false });
      if (!points.length) return;
      if (points.length === 1) {
        map.setView(points[0], 4, { animate: false });
        return;
      }
      map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 5, animate: false });
    };
    fit();
    const frame = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(frame);
    // Ajusta só quando o conjunto de países muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature]);

  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1">
      <button
        type="button"
        aria-label={t('home.globalMap.zoomIn')}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => map.zoomIn()}
        className="grid size-8 place-items-center rounded-md bg-white text-[1.15rem] leading-none font-semibold text-cac-navy shadow-[0_2px_8px_rgba(10,36,64,.16)] hover:bg-cac-bg"
      >
        +
      </button>
      <button
        type="button"
        aria-label={t('home.globalMap.zoomOut')}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => map.zoomOut()}
        className="grid size-8 place-items-center rounded-md bg-white text-[1.15rem] leading-none font-semibold text-cac-navy shadow-[0_2px_8px_rgba(10,36,64,.16)] hover:bg-cac-bg"
      >
        −
      </button>
    </div>
  );
}

function countryName(code: string, language: string) {
  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

type MapPoint = {
  code: string;
  lat: number;
  lng: number;
  region: string;
  note: string;
  name: string;
  origin: boolean;
};

/** Mapa dos países de aplicação, com o país de origem em estrela dourada. */
export function ApplicationPlacesMap({
  places,
  origin,
}: {
  places: Place[];
  origin?: { country?: string | null; region?: string | null } | null;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const points = useMemo(() => {
    const result: MapPoint[] = [];
    const seen = new Set<string>();
    const originCode = origin?.country?.trim().toUpperCase() ?? '';
    if (originCode.length === 2) {
      const [lat, lng] = centroidFor(originCode, origin?.region);
      seen.add(originCode);
      result.push({
        code: originCode,
        lat,
        lng,
        region: origin?.region?.trim() || 'other',
        note: '',
        name: countryName(originCode, i18n.language),
        origin: true,
      });
    }
    for (const place of places) {
      const code = place.country.trim().toUpperCase();
      if (code.length !== 2 || seen.has(code)) continue;
      seen.add(code);
      const [lat, lng] = centroidFor(code, place.region);
      result.push({
        code,
        lat,
        lng,
        region: place.region?.trim() || 'other',
        note: place.note?.trim() || '',
        name: countryName(code, i18n.language),
        origin: false,
      });
    }
    return result;
  }, [places, origin?.country, origin?.region, i18n.language]);

  const originPoint = points.find((point) => point.origin) ?? null;
  const applicationPoints = points.filter((point) => !point.origin);

  const groups = useMemo(() => {
    const byRegion = new Map<string, MapPoint[]>();
    for (const point of applicationPoints) {
      const list = byRegion.get(point.region) ?? [];
      list.push(point);
      byRegion.set(point.region, list);
    }
    const keys = [...byRegion.keys()].sort((a, b) => {
      const ai = REGION_ORDER.indexOf(a);
      const bi = REGION_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return keys.map((region) => ({
      region,
      label: t(`detail.applicationRegions.${region}`, { defaultValue: region.replace(/_/g, ' ') }),
      countries: [...(byRegion.get(region) ?? [])].sort((a, b) => a.name.localeCompare(b.name, i18n.language)),
    }));
  }, [applicationPoints, t, i18n.language]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!points.length) return null;

  return (
    <div className="space-y-3">
      <h2 id="application-map-title" className="text-grande font-bold text-cac-navy">
        {t('detail.applicationMapTitle')}
      </h2>
      <div
        className="relative h-[300px] overflow-hidden rounded-[14px] border border-cac-line bg-[#c5d8e4]"
        role="region"
        aria-labelledby="application-map-title"
      >
        <MapContainer
          center={[18, 0]}
          zoom={2}
          minZoom={1}
          maxZoom={8}
          zoomSnap={0.5}
          zoomControl={false}
          scrollWheelZoom={false}
          className="cac-leaflet-map absolute inset-0"
        >
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"
          />
          {points.map((point) => (
            <Marker
              key={point.code}
              position={[point.lat, point.lng]}
              icon={point.origin ? originIcon : pointIcon}
              zIndexOffset={point.origin ? 800 : 0}
              title={point.origin ? `${point.name} · ${t('detail.originOnMap')}` : point.name}
              alt={point.origin ? `${point.name} · ${t('detail.originOnMap')}` : point.name}
            />
          ))}
          <FitPlaces points={points.map((point) => [point.lat, point.lng] as [number, number])} />
        </MapContainer>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-[12px] border border-cac-line bg-[#f7faf8] px-4 py-2.5 text-pequena font-bold text-cac-navy transition hover:border-cac-green/45 hover:bg-white"
      >
        <i className="fa-solid fa-earth-americas text-[0.95rem] text-cac-green" aria-hidden />
        {t('detail.applicationList')}
      </button>

      {open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="application-places-title"
              className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0a2440]/72 p-4"
              onClick={() => setOpen(false)}
            >
              <div
                className="flex max-h-[min(82vh,680px)] w-full max-w-[680px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_24px_70px_rgba(10,36,64,.28)]"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="flex items-start justify-between gap-4 border-b border-cac-line px-5 py-4 md:px-6">
                  <div>
                    <p className="text-mini font-bold tracking-[1.4px] text-cac-green uppercase">
                      {t('detail.applicationListEyebrow')}
                    </p>
                    <h2 id="application-places-title" className="mt-1 text-grande font-bold text-cac-navy">
                      {t('detail.applicationListTitle')}
                    </h2>
                    <p className="mt-1 text-mini text-cac-muted">
                      {t('detail.applicationListCount', { count: points.length })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t('detail.applicationListClose')}
                    className="grid size-9 shrink-0 place-items-center rounded-full border border-cac-line text-cac-navy transition hover:border-cac-green/40 hover:bg-cac-bg"
                  >
                    <i className="fa-solid fa-xmark" aria-hidden />
                  </button>
                </header>
                <div className="overflow-y-auto px-5 py-5 md:px-6">
                  <div className="space-y-6">
                    {originPoint ? (
                      <section>
                        <div className="mb-2.5 flex items-baseline justify-between gap-3 border-b border-cac-line/80 pb-1.5">
                          <h3 className="text-pequena font-bold text-cac-navy">{t('detail.originOnMap')}</h3>
                          <span className="text-[1rem] leading-none text-[#e6b31a]" aria-hidden>
                            ★
                          </span>
                        </div>
                        <ul>
                          <li className="rounded-[10px] border border-cac-line bg-[#fbfcfb] px-3 py-2">
                            <p className="text-pequena font-semibold text-cac-navy">{originPoint.name}</p>
                          </li>
                        </ul>
                      </section>
                    ) : null}
                    {groups.map((group) => (
                      <section key={group.region}>
                        <div className="mb-2.5 flex items-baseline justify-between gap-3 border-b border-cac-line/80 pb-1.5">
                          <h3 className="text-pequena font-bold text-cac-navy">{group.label}</h3>
                          <span className="text-mini font-bold text-cac-green tabular-nums">{group.countries.length}</span>
                        </div>
                        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                          {group.countries.map((country) => (
                            <li
                              key={country.code}
                              className="rounded-[10px] border border-cac-line bg-[#fbfcfb] px-3 py-2"
                            >
                              <p className="text-pequena font-semibold text-cac-navy">{country.name}</p>
                              {country.note ? (
                                <p className="mt-0.5 text-mini leading-snug text-cac-muted">{country.note}</p>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
