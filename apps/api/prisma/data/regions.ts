export type RegionSeed = { key: string; labelPt: string; labelEn: string; sortOrder: number };

export const REGIONS: RegionSeed[] = [
  { key: "africa", labelPt: "África", labelEn: "Africa", sortOrder: 1 },
  { key: "asia", labelPt: "Ásia", labelEn: "Asia", sortOrder: 2 },
  { key: "europe", labelPt: "Europa", labelEn: "Europe", sortOrder: 3 },
  { key: "global", labelPt: "Global", labelEn: "Global", sortOrder: 4 },
  { key: "latam", labelPt: "América Latina", labelEn: "Latin America", sortOrder: 5 },
  { key: "south_america", labelPt: "América do Sul", labelEn: "South America", sortOrder: 6 },
  { key: "middle_east", labelPt: "Oriente Médio", labelEn: "Middle East", sortOrder: 7 },
  { key: "north_america", labelPt: "América do Norte", labelEn: "North America", sortOrder: 8 },
  { key: "oceania", labelPt: "Oceania", labelEn: "Oceania", sortOrder: 9 },
];
