import { prisma } from './prisma.js';

export const PLACE_KINDS = ['TECHNOLOGY', 'CHALLENGE', 'FUNDING_OFFER', 'SUCCESS_CASE'] as const;
export type PlaceKind = (typeof PLACE_KINDS)[number];

export type ApplicationPlaceInput = {
  country?: string | null;
  region?: string | null;
  note?: string | null;
};

type SyncInput = {
  country?: string | null;
  region?: string | null;
  applicationPlaces?: ApplicationPlaceInput[] | null;
};

function cleanCountry(value: string | null | undefined) {
  const country = String(value ?? '').trim().toUpperCase();
  return country.length === 2 ? country : '';
}

/** Grava a origem e os países de aplicação sem duplicar o mesmo país. */
export async function syncContentPlaces(kind: PlaceKind, entityId: string, input: SyncInput) {
  const existing = await prisma.contentPlace.findMany({ where: { kind, entityId } });
  const originRow = existing.find((place) => place.role === 'ORIGIN');
  const originCountry = input.country !== undefined ? cleanCountry(input.country) : cleanCountry(originRow?.country);
  const originRegion =
    input.region !== undefined ? input.region || null : (originRow?.region ?? null);
  const apps =
    input.applicationPlaces !== undefined && input.applicationPlaces !== null
      ? input.applicationPlaces
      : existing.filter((place) => place.role === 'APPLICATION');

  const rows: Array<{
    kind: PlaceKind;
    entityId: string;
    role: string;
    country: string;
    region: string | null;
    note: string | null;
  }> = [];
  const seen = new Set<string>();
  if (originCountry) {
    seen.add(originCountry);
    rows.push({
      kind,
      entityId,
      role: 'ORIGIN',
      country: originCountry,
      region: originRegion,
      note: null,
    });
  }
  for (const app of apps) {
    const country = cleanCountry(app.country);
    if (!country || seen.has(country)) continue;
    seen.add(country);
    const note = String(app.note ?? '').trim();
    rows.push({
      kind,
      entityId,
      role: 'APPLICATION',
      country,
      region: app.region || null,
      note: note || null,
    });
  }

  await prisma.$transaction([
    prisma.contentPlace.deleteMany({ where: { kind, entityId } }),
    ...(rows.length ? [prisma.contentPlace.createMany({ data: rows })] : []),
  ]);
}

export async function applicationPlacesFor(kind: PlaceKind, entityId: string) {
  return prisma.contentPlace.findMany({
    where: { kind, entityId, role: 'APPLICATION' },
    orderBy: { country: 'asc' },
    select: { country: true, region: true, note: true },
  });
}

/** Filtro de país/região: vale a origem do cadastro ou qualquer país de aplicação. */
export async function geoWhere(
  kind: PlaceKind,
  filters: { country?: string; region?: string },
): Promise<Record<string, unknown>> {
  const country = cleanCountry(filters.country);
  const region = filters.region?.trim() || '';
  if (!country && !region) return {};

  const placeRows = await prisma.contentPlace.findMany({
    where: {
      kind,
      ...(country ? { country } : {}),
      ...(region ? { region } : {}),
    },
    select: { entityId: true },
  });
  const ids = [...new Set(placeRows.map((row) => row.entityId))];
  const column: Record<string, string> = {};
  if (country) column.country = country;
  if (region) column.region = region;
  if (!ids.length) return column;
  return { OR: [column, { id: { in: ids } }] };
}
