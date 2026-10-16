import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';

const shell = 'mx-auto w-full max-w-[1220px] px-[22px]';

type Kind = 'solution' | 'challenge' | 'funding' | 'case';
type Filter = 'all' | Kind;
type RegionId = 'north_america' | 'south_america' | 'europe' | 'africa' | 'asia' | 'oceania';

const KIND_COLOR: Record<Kind, string> = {
  solution: '#1f9d63',
  challenge: '#3b82f6',
  funding: '#ef8b22',
  case: '#e6b31a',
};

const KIND_SEARCH: Record<Kind, string> = {
  solution: 'SOLUTION',
  challenge: 'CHALLENGE',
  funding: 'FUNDER',
  case: 'CASE',
};

const REGION_COLOR: Record<RegionId, string> = {
  north_america: '#1b9a58',
  south_america: '#1b9a58',
  europe: '#2f78d8',
  africa: '#2f78d8',
  asia: '#2f78d8',
  oceania: '#2f78d8',
};

const TOTALS: Record<Kind, number> = {
  solution: 183,
  challenge: 56,
  funding: 74,
  case: 41,
};

const FILTERS: Array<{ id: Filter; labelKey: string }> = [
  { id: 'all', labelKey: 'home.globalMap.filterAll' },
  { id: 'challenge', labelKey: 'home.globalMap.filterChallenge' },
  { id: 'solution', labelKey: 'home.globalMap.filterSolution' },
  { id: 'funding', labelKey: 'home.globalMap.filterFunding' },
  { id: 'case', labelKey: 'home.globalMap.filterCase' },
];

const LEGEND: Array<{ id: Kind; labelKey: string }> = [
  { id: 'solution', labelKey: 'home.globalMap.legendSolution' },
  { id: 'challenge', labelKey: 'home.globalMap.legendChallenge' },
  { id: 'funding', labelKey: 'home.globalMap.legendFunding' },
  { id: 'case', labelKey: 'home.globalMap.legendCase' },
];

const REGION_MARKERS: Record<RegionId, Record<Kind, number>> = {
  north_america: { solution: 6, challenge: 2, funding: 3, case: 1 },
  south_america: { solution: 14, challenge: 5, funding: 6, case: 3 },
  europe: { solution: 7, challenge: 3, funding: 3, case: 2 },
  africa: { solution: 8, challenge: 3, funding: 4, case: 3 },
  asia: { solution: 5, challenge: 2, funding: 3, case: 1 },
  oceania: { solution: 3, challenge: 1, funding: 1, case: 1 },
};

/** Um ponto por estado ou região administrativa, em latitude/longitude reais. */
const PLACES: Record<RegionId, Array<{ id: string; lat: number; lng: number }>> = {
  north_america: [
    { id: 'us-ca', lat: 36.7, lng: -119.4 },
    { id: 'us-tx', lat: 31.0, lng: -99.0 },
    { id: 'us-fl', lat: 28.5, lng: -82.5 },
    { id: 'us-ny', lat: 42.9, lng: -75.5 },
    { id: 'us-il', lat: 40.0, lng: -89.2 },
    { id: 'us-wa', lat: 47.4, lng: -120.5 },
    { id: 'ca-on', lat: 48.5, lng: -84.5 },
    { id: 'ca-qc', lat: 52.0, lng: -71.5 },
    { id: 'ca-bc', lat: 53.8, lng: -125.0 },
    { id: 'mx-cmx', lat: 19.4, lng: -99.1 },
    { id: 'mx-jal', lat: 20.7, lng: -103.3 },
    { id: 'mx-yuc', lat: 20.7, lng: -89.0 },
  ],
  south_america: [
    { id: 'br-sp', lat: -22.2, lng: -48.8 },
    { id: 'br-mg', lat: -18.5, lng: -44.5 },
    { id: 'br-rj', lat: -22.3, lng: -42.7 },
    { id: 'br-ba', lat: -12.5, lng: -41.7 },
    { id: 'br-pr', lat: -24.6, lng: -51.6 },
    { id: 'br-rs', lat: -29.7, lng: -53.2 },
    { id: 'br-pe', lat: -8.4, lng: -37.9 },
    { id: 'br-ce', lat: -5.1, lng: -39.6 },
    { id: 'br-pa', lat: -3.8, lng: -52.5 },
    { id: 'br-go', lat: -16.0, lng: -49.8 },
    { id: 'br-mt', lat: -12.8, lng: -55.9 },
    { id: 'br-am', lat: -4.0, lng: -64.5 },
    { id: 'br-ms', lat: -20.5, lng: -54.6 },
    { id: 'br-sc', lat: -27.2, lng: -50.5 },
    { id: 'co-dc', lat: 4.7, lng: -74.1 },
    { id: 'co-ant', lat: 6.8, lng: -75.6 },
    { id: 'co-vac', lat: 3.8, lng: -76.5 },
    { id: 'co-atl', lat: 10.7, lng: -74.9 },
    { id: 'co-san', lat: 6.8, lng: -73.2 },
    { id: 'ar-ba', lat: -36.5, lng: -60.0 },
    { id: 'ar-cb', lat: -31.4, lng: -64.2 },
    { id: 'ar-mz', lat: -34.6, lng: -68.3 },
    { id: 'ar-sf', lat: -31.6, lng: -60.7 },
    { id: 'ar-ch', lat: -43.8, lng: -68.5 },
    { id: 'pe-lim', lat: -12.0, lng: -77.0 },
    { id: 'pe-cus', lat: -13.5, lng: -72.0 },
    { id: 'pe-are', lat: -16.4, lng: -71.5 },
    { id: 'pe-lor', lat: -4.0, lng: -74.0 },
  ],
  europe: [
    { id: 'fr-idf', lat: 48.7, lng: 2.5 },
    { id: 'fr-naq', lat: 45.0, lng: 0.2 },
    { id: 'fr-occ', lat: 43.7, lng: 2.2 },
    { id: 'fr-ara', lat: 45.5, lng: 4.5 },
    { id: 'de-by', lat: 48.8, lng: 11.5 },
    { id: 'de-nw', lat: 51.5, lng: 7.5 },
    { id: 'de-be', lat: 52.5, lng: 13.4 },
    { id: 'es-md', lat: 40.4, lng: -3.7 },
    { id: 'es-ct', lat: 41.8, lng: 1.6 },
    { id: 'es-an', lat: 37.5, lng: -4.5 },
    { id: 'gb-eng', lat: 52.3, lng: -1.5 },
    { id: 'gb-sct', lat: 56.8, lng: -4.2 },
    { id: 'it-lom', lat: 45.6, lng: 9.8 },
    { id: 'it-laz', lat: 41.9, lng: 12.7 },
    { id: 'it-cam', lat: 40.8, lng: 14.5 },
  ],
  africa: [
    { id: 'ng-la', lat: 6.5, lng: 3.4 },
    { id: 'ng-fc', lat: 9.1, lng: 7.4 },
    { id: 'ng-kn', lat: 12.0, lng: 8.5 },
    { id: 'ng-ri', lat: 4.8, lng: 7.0 },
    { id: 'ng-oy', lat: 7.8, lng: 3.9 },
    { id: 'ke-nb', lat: -1.3, lng: 36.8 },
    { id: 'ke-mb', lat: -4.0, lng: 39.7 },
    { id: 'ke-ks', lat: -0.1, lng: 34.8 },
    { id: 'ke-nk', lat: -0.3, lng: 36.1 },
    { id: 'za-gt', lat: -26.2, lng: 28.0 },
    { id: 'za-wc', lat: -33.6, lng: 19.5 },
    { id: 'za-kz', lat: -29.0, lng: 30.5 },
    { id: 'za-ec', lat: -32.3, lng: 26.4 },
    { id: 'et-aa', lat: 9.0, lng: 38.7 },
    { id: 'et-or', lat: 7.5, lng: 39.5 },
    { id: 'et-am', lat: 11.5, lng: 38.0 },
    { id: 'gh-aa', lat: 5.6, lng: -0.2 },
    { id: 'gh-ah', lat: 6.7, lng: -1.6 },
  ],
  asia: [
    { id: 'cn-bj', lat: 40.2, lng: 116.4 },
    { id: 'cn-sh', lat: 31.2, lng: 121.5 },
    { id: 'cn-gd', lat: 23.4, lng: 113.3 },
    { id: 'cn-sc', lat: 30.6, lng: 103.0 },
    { id: 'in-mh', lat: 19.2, lng: 76.0 },
    { id: 'in-dl', lat: 28.6, lng: 77.2 },
    { id: 'in-ka', lat: 14.7, lng: 75.7 },
    { id: 'in-tn', lat: 11.1, lng: 78.4 },
    { id: 'jp-tk', lat: 35.7, lng: 139.7 },
    { id: 'jp-os', lat: 34.7, lng: 135.5 },
    { id: 'id-jk', lat: -6.2, lng: 106.8 },
  ],
  oceania: [
    { id: 'au-nsw', lat: -32.5, lng: 146.5 },
    { id: 'au-vic', lat: -36.8, lng: 144.5 },
    { id: 'au-qld', lat: -22.0, lng: 144.0 },
    { id: 'au-wa', lat: -25.5, lng: 122.0 },
    { id: 'nz-auk', lat: -36.9, lng: 174.8 },
    { id: 'nz-can', lat: -43.5, lng: 172.0 },
  ],
};

type Point = { id: string; kind: Kind; region: RegionId; lat: number; lng: number };

function buildPoints(): Point[] {
  const out: Point[] = [];
  for (const region of Object.keys(PLACES) as RegionId[]) {
    const counts = REGION_MARKERS[region];
    const kinds = (Object.keys(counts) as Kind[]).flatMap((kind) => Array.from({ length: counts[kind] }, () => kind));
    PLACES[region].forEach((place, index) => {
      const kind = kinds[index];
      if (!kind) return;
      out.push({ id: place.id, kind, region, lat: place.lat, lng: place.lng });
    });
  }
  return out;
}

const POINTS = buildPoints();

const COUNTRIES: Array<{
  code: string;
  region: RegionId;
  counts: Record<Kind, number>;
}> = [
  { code: 'BR', region: 'south_america', counts: { solution: 42, challenge: 18, funding: 20, case: 12 } },
  { code: 'US', region: 'north_america', counts: { solution: 18, challenge: 9, funding: 14, case: 7 } },
  { code: 'FR', region: 'europe', counts: { solution: 12, challenge: 6, funding: 10, case: 5 } },
  { code: 'KE', region: 'africa', counts: { solution: 9, challenge: 5, funding: 6, case: 4 } },
  { code: 'CO', region: 'south_america', counts: { solution: 8, challenge: 4, funding: 6, case: 3 } },
];

function searchHref(filter: Filter, extra?: { country?: string; region?: string }) {
  const params = new URLSearchParams();
  if (extra?.region) params.set('region', extra.region);
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

const POINT_ICONS: Record<Kind, L.DivIcon> = {
  solution: pointIcon('solution'),
  challenge: pointIcon('challenge'),
  funding: pointIcon('funding'),
  case: pointIcon('case'),
};

function pointIcon(kind: Kind) {
  return L.divIcon({
    className: 'cac-cluster-icon',
    html: `<span style="display:grid;width:16px;height:16px;place-items:center;border-radius:999px;background:${KIND_COLOR[kind]};color:#fff;font:700 9px/1 sans-serif;box-shadow:0 0 0 1.5px #fff;">1</span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function clusterIcon(cluster: L.MarkerCluster) {
  const markers = cluster.getAllChildMarkers();
  const count = markers.length;
  const kinds = new Set<Kind>();
  const regions = new Map<RegionId, number>();
  for (const marker of markers) {
    const [kind, region] = String(marker.options.alt ?? '').split(':') as [Kind, RegionId];
    if (kind) kinds.add(kind);
    if (region) regions.set(region, (regions.get(region) ?? 0) + 1);
  }
  let region: RegionId = 'europe';
  let best = 0;
  for (const [id, total] of regions) {
    if (total > best) {
      best = total;
      region = id;
    }
  }
  const color = kinds.size === 1 ? KIND_COLOR[[...kinds][0]] : REGION_COLOR[region];
  const size = bubbleSize(count);
  const font = count >= 10 ? 14 : 12;
  return L.divIcon({
    className: 'cac-cluster-icon',
    html: `<span style="display:grid;width:${size}px;height:${size}px;place-items:center;border-radius:999px;background:${color};color:#fff;font:700 ${font}px/1 sans-serif;box-shadow:0 6px 14px rgba(10,36,64,.22),0 0 0 2px #fff;">${count}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
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
      // A largura do mundo ocupa a área inteira; o corte fica nos polos.
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
  const frame = 'h-[15px] w-[22px] shrink-0 overflow-hidden rounded-[2px] shadow-[0_0_0_1px_rgba(10,36,64,.14)]';
  if (code === 'BR') {
    return (
      <svg viewBox="0 0 22 15" className={frame} aria-hidden>
        <rect width="22" height="15" fill="#009c3b" />
        <polygon points="11,1.3 20.4,7.5 11,13.7 1.6,7.5" fill="#ffdf00" />
        <circle cx="11" cy="7.5" r="2.7" fill="#002776" />
      </svg>
    );
  }
  if (code === 'US') {
    return (
      <svg viewBox="0 0 22 15" className={frame} aria-hidden>
        <rect width="22" height="15" fill="#bf0a30" />
        <rect y="1.15" width="22" height="1.15" fill="#fff" />
        <rect y="3.45" width="22" height="1.15" fill="#fff" />
        <rect y="5.75" width="22" height="1.15" fill="#fff" />
        <rect y="8.05" width="22" height="1.15" fill="#fff" />
        <rect y="10.35" width="22" height="1.15" fill="#fff" />
        <rect y="12.65" width="22" height="1.15" fill="#fff" />
        <rect width="9.2" height="8.1" fill="#002868" />
      </svg>
    );
  }
  if (code === 'FR') {
    return (
      <svg viewBox="0 0 22 15" className={frame} aria-hidden>
        <rect width="7.34" height="15" fill="#0055a4" />
        <rect x="7.34" width="7.32" height="15" fill="#fff" />
        <rect x="14.66" width="7.34" height="15" fill="#ef4135" />
      </svg>
    );
  }
  if (code === 'KE') {
    return (
      <svg viewBox="0 0 22 15" className={frame} aria-hidden>
        <rect width="22" height="15" fill="#fff" />
        <rect width="22" height="4.2" fill="#000" />
        <rect y="5.2" width="22" height="4.6" fill="#bb0000" />
        <rect y="10.8" width="22" height="4.2" fill="#006600" />
        <ellipse cx="11" cy="7.5" rx="2.3" ry="3.1" fill="#fff" />
        <ellipse cx="11" cy="7.5" rx="1.35" ry="2.2" fill="#000" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 22 15" className={frame} aria-hidden>
      <rect width="22" height="7.5" fill="#fcd116" />
      <rect y="7.5" width="22" height="3.75" fill="#003893" />
      <rect y="11.25" width="22" height="3.75" fill="#ce1126" />
    </svg>
  );
}

export function GlobalClimateMap() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('all');
  const points = useMemo(
    () => (filter === 'all' ? POINTS : POINTS.filter((point) => point.kind === filter)),
    [filter],
  );

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
            <div className="relative min-h-[340px] overflow-hidden rounded-[14px] bg-[#d5d5d5] lg:h-full">
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
                  attribution='&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                />
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}" />
                <MarkerClusterGroup
                  key={filter}
                  chunkedLoading
                  showCoverageOnHover={false}
                  zoomToBoundsOnClick
                  spiderfyOnMaxZoom
                  maxClusterRadius={(zoom) => (zoom <= 2 ? 100 : 40)}
                  disableClusteringAtZoom={6}
                  iconCreateFunction={clusterIcon}
                >
                  {points.map((point) => (
                    <Marker
                      key={point.id}
                      position={[point.lat, point.lng]}
                      icon={POINT_ICONS[point.kind]}
                      alt={`${point.kind}:${point.region}`}
                    />
                  ))}
                </MarkerClusterGroup>
                <MapChrome />
              </MapContainer>
            </div>

            <aside className="flex min-w-0 flex-col">
              <ul className="space-y-2" aria-label={t('home.globalMap.legendLabel')}>
                {LEGEND.map((item) => {
                  const active = filter === 'all' || filter === item.id;
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
                          {TOTALS[item.id]}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <h3 className="mt-4 mb-1 border-t border-cac-line pt-4 text-pequena font-bold text-cac-navy">
                {t('home.globalMap.featuredTitle')}
              </h3>
              <ul className="flex-1">
                {COUNTRIES.map((country) => (
                  <li key={country.code}>
                    <Link
                      to={searchHref(filter, { country: country.code, region: country.region })}
                      className="group grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-2.5 rounded-lg px-0.5 py-2 transition hover:bg-cac-bg"
                    >
                      <Flag code={country.code} />
                      <span className="truncate text-pequena font-semibold text-cac-navy">
                        {t(`home.globalMap.countries.${country.code}`)}
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
