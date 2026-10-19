import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import { fetchMapSnapshot, type MapCountry, type MapKind, type MapSnapshot } from '../api/mapApi';

const shell = 'mx-auto w-full max-w-[1220px] px-[22px]';

type Filter = 'all' | MapKind;

const KIND_COLOR: Record<MapKind, string> = {
  solution: '#1f9d63',
  challenge: '#3b82f6',
  funding: '#ef8b22',
  case: '#e6b31a',
};

const KIND_SEARCH: Record<MapKind, string> = {
  solution: 'SOLUTION',
  challenge: 'CHALLENGE',
  funding: 'FUNDER',
  case: 'CASE',
};

const FILTERS: Array<{ id: Filter; labelKey: string }> = [
  { id: 'all', labelKey: 'home.globalMap.filterAll' },
  { id: 'challenge', labelKey: 'home.globalMap.filterChallenge' },
  { id: 'solution', labelKey: 'home.globalMap.filterSolution' },
  { id: 'funding', labelKey: 'home.globalMap.filterFunding' },
  { id: 'case', labelKey: 'home.globalMap.filterCase' },
];

const LEGEND: Array<{ id: MapKind; totalKey: keyof MapSnapshot['totals']; labelKey: string }> = [
  { id: 'solution', totalKey: 'solutions', labelKey: 'home.globalMap.legendSolution' },
  { id: 'challenge', totalKey: 'challenges', labelKey: 'home.globalMap.legendChallenge' },
  { id: 'funding', totalKey: 'funding', labelKey: 'home.globalMap.legendFunding' },
  { id: 'case', totalKey: 'cases', labelKey: 'home.globalMap.legendCase' },
];

function searchHref(filter: Filter, extra?: { country?: string }) {
  const params = new URLSearchParams();
  if (extra?.country) params.set('country', extra.country);
  if (filter !== 'all') params.set('contentType', KIND_SEARCH[filter]);
  const query = params.toString();
  return query ? `/search?${query}` : '/search';
}

function bubbleSize(count: number) {
  if (count >= 20) return 46;
  if (count >= 10) return 38;
  if (count >= 5) return 32;
  return 26;
}

function regionColor(region: string | null) {
  if (region === 'north_america' || region === 'south_america' || region === 'latam') return '#1b9a58';
  return '#2f78d8';
}

function visibleCount(country: MapCountry, filter: Filter) {
  if (filter === 'all') return country.total;
  return country.counts[filter];
}

function markerColor(country: MapCountry, filter: Filter) {
  if (filter !== 'all') return KIND_COLOR[filter];
  const top = (Object.entries(country.counts) as Array<[MapKind, number]>).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] === country.total) return KIND_COLOR[top[0]];
  return regionColor(country.region);
}

function countIcon(count: number, color: string) {
  const size = bubbleSize(count);
  const font = count >= 10 ? 14 : 12;
  return L.divIcon({
    className: 'cac-cluster-icon',
    html: `<span style="display:grid;width:${size}px;height:${size}px;place-items:center;border-radius:999px;background:${color};color:#fff;font:700 ${font}px/1 sans-serif;box-shadow:0 6px 14px rgba(10,36,64,.22),0 0 0 2px #fff;cursor:pointer;">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function clusterIcon(cluster: L.MarkerCluster) {
  const markers = cluster.getAllChildMarkers();
  let count = 0;
  const regions = new Map<string, number>();
  const colors = new Set<string>();
  for (const marker of markers) {
    const [rawCount, region, color] = String(marker.options.alt ?? '').split(':');
    const n = Number(rawCount);
    count += Number.isFinite(n) ? n : 1;
    if (region) regions.set(region, (regions.get(region) ?? 0) + (Number.isFinite(n) ? n : 1));
    if (color) colors.add(color);
  }
  let region = '';
  let best = 0;
  for (const [id, total] of regions) {
    if (total > best) {
      best = total;
      region = id;
    }
  }
  const color = colors.size === 1 ? [...colors][0] : regionColor(region);
  const size = bubbleSize(count);
  const font = count >= 10 ? 14 : 12;
  return L.divIcon({
    className: 'cac-cluster-icon',
    html: `<span style="display:grid;width:${size}px;height:${size}px;place-items:center;border-radius:999px;background:${color};color:#fff;font:700 ${font}px/1 sans-serif;box-shadow:0 6px 14px rgba(10,36,64,.22),0 0 0 2px #fff;">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function countryName(code: string, lang: string) {
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

function MapChrome() {
  const map = useMap();
  const { t } = useTranslation();
  const fittedOnce = useRef(false);

  useEffect(() => {
    const fit = () => {
      map.invalidateSize({ animate: false });
      const size = map.getSize();
      if (size.x < 40 || size.y < 40) return;
      const userZoom = map.getZoom();
      const userMin = map.getMinZoom();
      const keepZoom = fittedOnce.current && userZoom > userMin + 0.05;
      const zoom = Math.log(size.x / 256) / Math.LN2;
      map.setMinZoom(zoom);
      if (!keepZoom) map.setView([18, 0], zoom, { animate: false });
      fittedOnce.current = true;
    };
    fit();
    const frame = requestAnimationFrame(fit);
    map.on('resize', fit);
    return () => {
      cancelAnimationFrame(frame);
      map.off('resize', fit);
    };
  }, [map]);

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

function Flag({ code }: { code: string }) {
  const iso = code.trim().toLowerCase();
  const valid = /^[a-z]{2}$/.test(iso);
  const [failed, setFailed] = useState(false);
  if (!valid || failed) {
    return (
      <span
        className="grid h-[15px] w-[22px] shrink-0 place-items-center overflow-hidden rounded-[2px] bg-white text-[8px] font-bold leading-none tracking-tight text-cac-navy shadow-[0_0_0_1px_rgba(10,36,64,.14)]"
        aria-hidden
      >
        {code.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      alt=""
      width={22}
      height={15}
      loading="lazy"
      className="h-[15px] w-[22px] shrink-0 rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(10,36,64,.14)]"
      onError={() => setFailed(true)}
    />
  );
}

export function GlobalClimateMap() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [snapshot, setSnapshot] = useState<MapSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchMapSnapshot()
      .then((data) => {
        if (!cancelled) setSnapshot(data);
      })
      .catch(() => {
        if (!cancelled) setSnapshot(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const countries = useMemo(() => {
    const rows = snapshot?.countries ?? [];
    return rows
      .map((country) => ({ ...country, shown: visibleCount(country, filter) }))
      .filter((country) => country.shown > 0)
      .sort((a, b) => b.shown - a.shown || a.country.localeCompare(b.country));
  }, [snapshot, filter]);

  const featured = countries.slice(0, 5);

  return (
    <section className="bg-cac-bg py-8" aria-labelledby="global-map-title">
      <div className={shell}>
        <div className="rounded-[18px] border border-cac-line bg-white p-4 shadow-[0_10px_28px_rgba(10,36,64,.06)] sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="min-w-0 max-w-[38rem]">
              <h2 id="global-map-title" className="text-[1.6rem] leading-tight font-bold tracking-[-0.6px] text-cac-navy">
                {t('home.globalMap.title')}
              </h2>
              <p className="mt-1.5 text-pequena leading-snug text-cac-muted">{t('home.globalMap.support')}</p>
            </div>
            <div
              className="flex flex-wrap gap-1.5 lg:shrink-0 lg:flex-nowrap lg:self-start lg:pt-1"
              role="radiogroup"
              aria-label={t('home.globalMap.filtersLabel')}
            >
              {FILTERS.map((item) => {
                const active = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFilter(item.id)}
                    className={`rounded-full px-3 py-1.5 text-mini font-bold whitespace-nowrap transition ${
                      active
                        ? 'bg-cac-navy text-white'
                        : 'border border-cac-line bg-white text-cac-navy hover:bg-cac-bg'
                    }`}
                  >
                    {t(item.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,340px)] lg:gap-8">
            <div className="relative min-h-[340px] overflow-hidden rounded-[14px] bg-[#c5d8e4] lg:h-full">
              <MapContainer
                center={[18, 0]}
                zoom={2}
                minZoom={0}
                maxZoom={8}
                zoomSnap={0}
                zoomDelta={1}
                zoomControl={false}
                scrollWheelZoom={false}
                className="cac-leaflet-map absolute inset-0"
              >
                <TileLayer
                  attribution="Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"
                />
                <MarkerClusterGroup
                  key={filter}
                  chunkedLoading
                  showCoverageOnHover={false}
                  zoomToBoundsOnClick
                  spiderfyOnMaxZoom={false}
                  maxClusterRadius={(zoom) => (zoom <= 2 ? 80 : 36)}
                  disableClusteringAtZoom={5}
                  iconCreateFunction={clusterIcon}
                >
                  {countries.map((country) => {
                    const color = markerColor(country, filter);
                    return (
                      <Marker
                        key={country.country}
                        position={[country.lat, country.lng]}
                        icon={countIcon(country.shown, color)}
                        alt={`${country.shown}:${country.region ?? ''}:${color}`}
                        eventHandlers={{
                          click: () =>
                            navigate(searchHref(filter, { country: country.country })),
                        }}
                      />
                    );
                  })}
                </MarkerClusterGroup>
                <MapChrome />
              </MapContainer>
            </div>

            <aside className="flex min-w-0 flex-col">
              <ul className="space-y-2" aria-label={t('home.globalMap.legendLabel')}>
                {LEGEND.map((item) => {
                  const active = filter === 'all' || filter === item.id;
                  const total = snapshot ? snapshot.totals[item.totalKey] : null;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setFilter(filter === item.id ? 'all' : item.id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-0.5 py-0.5 text-left transition hover:bg-cac-bg ${
                          active ? '' : 'opacity-40'
                        }`}
                      >
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: KIND_COLOR[item.id] }}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1 text-pequena text-cac-ink">{t(item.labelKey)}</span>
                        <span className="w-8 text-right text-pequena font-bold text-cac-navy tabular-nums">
                          {total ?? '—'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-mini leading-snug text-cac-muted">{t('home.globalMap.countingNote')}</p>

              <h3 className="mt-4 mb-1 border-t border-cac-line pt-4 text-pequena font-bold text-cac-navy">
                {t('home.globalMap.featuredTitle')}
              </h3>
              {featured.length ? (
                <ul className="flex-1">
                  {featured.map((country) => (
                    <li key={country.country}>
                      <Link
                        to={searchHref(filter, { country: country.country })}
                        className="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2.5 rounded-lg px-0.5 py-2 transition hover:bg-cac-bg"
                      >
                        <Flag code={country.country} />
                        <span className="truncate text-pequena font-semibold text-cac-navy">
                          {countryName(country.country, i18n.language)}
                        </span>
                        <span className="grid grid-cols-4 gap-x-1 text-center text-[13px] leading-none font-bold tabular-nums">
                          {LEGEND.map((item) => (
                            <span
                              key={item.id}
                              style={{ color: KIND_COLOR[item.id] }}
                              className={`w-6 ${filter !== 'all' && filter !== item.id ? 'opacity-30' : ''}`}
                            >
                              {country.counts[item.id]}
                            </span>
                          ))}
                        </span>
                        <i
                          className="fa-solid fa-chevron-right justify-self-end text-[10px] text-[#b7c4c8] transition group-hover:text-cac-green"
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex-1 py-3 text-mini text-cac-muted">{t('home.globalMap.emptyCountries')}</p>
              )}

              <Link
                to={searchHref(filter)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-[12px] border border-cac-line bg-white px-4 py-2.5 text-pequena font-bold text-cac-navy transition hover:bg-cac-bg"
              >
                {t('home.globalMap.seeAll')}
                <span aria-hidden>→</span>
              </Link>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
