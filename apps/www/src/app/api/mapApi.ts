import { urls } from '../../config';

export type MapKind = 'solution' | 'challenge' | 'funding' | 'case';

export type MapCountry = {
  country: string;
  region: string | null;
  lat: number;
  lng: number;
  counts: Record<MapKind, number>;
  total: number;
};

export type MapTotals = {
  solutions: number;
  challenges: number;
  funding: number;
  cases: number;
  organizations: number;
  countries: number;
  links: number;
};

export type MapSnapshot = {
  totals: MapTotals;
  countries: MapCountry[];
};

export async function fetchMapSnapshot(): Promise<MapSnapshot> {
  const response = await fetch(`${urls.api}/api/map`);
  if (!response.ok) throw new Error('map_failed');
  return response.json() as Promise<MapSnapshot>;
}
