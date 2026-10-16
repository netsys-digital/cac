import { ContentStatus } from '@cac/shared';
import { centroidFor } from '../../lib/country-centroids.js';
import type { PlaceKind } from '../../lib/content-places.js';
import { prisma } from '../../lib/prisma.js';

type KindKey = 'solution' | 'challenge' | 'funding' | 'case';

type Bucket = {
  country: string;
  region: string | null;
  counts: Record<KindKey, number>;
  seen: Record<KindKey, Set<string>>;
};

const KIND_OF: Record<PlaceKind, KindKey> = {
  TECHNOLOGY: 'solution',
  CHALLENGE: 'challenge',
  FUNDING_OFFER: 'funding',
  SUCCESS_CASE: 'case',
};

function emptyCounts(): Record<KindKey, number> {
  return { solution: 0, challenge: 0, funding: 0, case: 0 };
}

function touch(buckets: Map<string, Bucket>, country: string, region: string | null, key: KindKey, id: string) {
  const code = country.toUpperCase();
  if (code.length !== 2) return;
  let bucket = buckets.get(code);
  if (!bucket) {
    bucket = { country: code, region: region ?? null, counts: emptyCounts(), seen: {
      solution: new Set(),
      challenge: new Set(),
      funding: new Set(),
      case: new Set(),
    } };
    buckets.set(code, bucket);
  }
  if (!bucket.region && region) bucket.region = region;
  if (bucket.seen[key].has(id)) return;
  bucket.seen[key].add(id);
  bucket.counts[key] += 1;
}

export async function buildMapSnapshot() {
  const published = { status: ContentStatus.PUBLISHED };
  const [technologies, challenges, offers, cases, places, organizations] = await Promise.all([
    prisma.technology.findMany({
      where: published,
      select: { id: true, country: true, region: true },
    }),
    prisma.challenge.findMany({
      where: published,
      select: { id: true, country: true, region: true },
    }),
    prisma.fundingOffer.findMany({
      where: published,
      select: { id: true, country: true, region: true },
    }),
    prisma.successCase.findMany({
      where: published,
      select: { id: true, country: true, region: true },
    }),
    prisma.contentPlace.findMany({
      select: { kind: true, entityId: true, country: true, region: true },
    }),
    prisma.organization.count(),
  ]);

  const publishedIds = {
    TECHNOLOGY: new Set(technologies.map((item) => item.id)),
    CHALLENGE: new Set(challenges.map((item) => item.id)),
    FUNDING_OFFER: new Set(offers.map((item) => item.id)),
    SUCCESS_CASE: new Set(cases.map((item) => item.id)),
  };

  const buckets = new Map<string, Bucket>();
  const linked = {
    TECHNOLOGY: new Set<string>(),
    CHALLENGE: new Set<string>(),
    FUNDING_OFFER: new Set<string>(),
    SUCCESS_CASE: new Set<string>(),
  };

  for (const place of places) {
    const kind = place.kind as PlaceKind;
    const ids = publishedIds[kind];
    if (!ids?.has(place.entityId)) continue;
    linked[kind].add(place.entityId);
    touch(buckets, place.country, place.region, KIND_OF[kind], place.entityId);
  }

  const origins: Array<{ kind: PlaceKind; id: string; country: string | null; region: string | null }> = [
    ...technologies.map((item) => ({ kind: 'TECHNOLOGY' as const, ...item })),
    ...challenges.map((item) => ({ kind: 'CHALLENGE' as const, ...item })),
    ...offers.map((item) => ({ kind: 'FUNDING_OFFER' as const, ...item })),
    ...cases.map((item) => ({ kind: 'SUCCESS_CASE' as const, ...item })),
  ];
  for (const item of origins) {
    if (linked[item.kind].has(item.id) || !item.country) continue;
    touch(buckets, item.country, item.region, KIND_OF[item.kind], item.id);
  }

  let links = 0;
  const countries = [...buckets.values()]
    .map((bucket) => {
      const total = bucket.counts.solution + bucket.counts.challenge + bucket.counts.funding + bucket.counts.case;
      links += total;
      const [lat, lng] = centroidFor(bucket.country, bucket.region);
      return {
        country: bucket.country,
        region: bucket.region,
        lat,
        lng,
        counts: bucket.counts,
        total,
      };
    })
    .filter((country) => country.total > 0)
    .sort((a, b) => b.total - a.total || a.country.localeCompare(b.country));

  return {
    totals: {
      solutions: technologies.length,
      challenges: challenges.length,
      funding: offers.length,
      cases: cases.length,
      organizations,
      countries: countries.length,
      links,
    },
    countries,
  };
}
