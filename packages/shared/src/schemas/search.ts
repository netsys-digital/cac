import { z } from 'zod';

export const SearchContentType = {
  SOLUTION: 'SOLUTION',
  PROJECT: 'PROJECT',
  ORGANIZATION: 'ORGANIZATION',
  FUNDER: 'FUNDER',
  CASE: 'CASE',
  CHALLENGE: 'CHALLENGE',
} as const;
export type SearchContentType = (typeof SearchContentType)[keyof typeof SearchContentType];

export const FunderKind = {
  ACTIVE_OFFER: 'ACTIVE_OFFER',
  DIRECTORY: 'DIRECTORY',
} as const;
export type FunderKind = (typeof FunderKind)[keyof typeof FunderKind];

export const searchFiltersSchema = z.object({
  country: z.string().optional(),
  region: z.string().optional(),
  theme: z.string().optional(), // ClimateAction or Domain key
  actorType: z.string().optional(),
  sector: z.string().optional(),
  maturity: z.string().optional(),
  scale: z.string().optional(),
  financing: z.enum(['WITH_OPPORTUNITY', 'ALL']).optional(),
  contentType: z
    .enum(['SOLUTION', 'PROJECT', 'ORGANIZATION', 'FUNDER', 'CASE', 'CHALLENGE', 'ALL'])
    .optional(),
});

export const searchBodySchema = z.object({
  query: z.string().default(''),
  filters: searchFiltersSchema.default({}),
  lang: z.enum(['pt', 'en', 'es']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export type SearchBody = z.infer<typeof searchBodySchema>;
export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export const scoreFactorSchema = z.object({
  label: z.string(),
  weight: z.number(),
  value: z.number(),
});

export type ScoreFactor = z.infer<typeof scoreFactorSchema>;

export const DEFAULT_SCORE_WEIGHTS = {
  semantic: 40,
  tags: 25,
  region: 15,
  maturity: 10,
  need: 10,
} as const;

/** Parse `SCORE_WEIGHTS=semantic:40,tags:25,region:15,maturity:10,need:10` */
export function parseScoreWeights(raw?: string | null): typeof DEFAULT_SCORE_WEIGHTS {
  if (!raw?.trim()) return { ...DEFAULT_SCORE_WEIGHTS };
  const next = { ...DEFAULT_SCORE_WEIGHTS };
  for (const part of raw.split(',')) {
    const [key, value] = part.split(':').map((s) => s.trim());
    if (key in next && value && !Number.isNaN(Number(value))) {
      (next as Record<string, number>)[key] = Number(value);
    }
  }
  return next;
}
