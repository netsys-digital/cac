import {
  ContentStatus,
  type SearchBody,
  type ScoreFactor,
} from '@cac/shared';
import { env } from '../../config/env.js';
import { getEmbeddingProvider } from '../../lib/embeddings/provider.js';
import { prisma } from '../../lib/prisma.js';
import { interpretQuery } from './interpret.js';
import { localizeEntities } from '../../lib/translation/localize.js';
import type { TranslationEntityType } from '../../lib/translation/fields.js';
import {
  applyAnchorCalibration,
  composeScore,
  cosineSimilarity,
  getScoreWeights,
  keywordOverlap,
  maturityScore,
  needScore,
  regionScore,
  tagOverlap,
  tokenize,
} from './score.js';

export type SearchResultItem = {
  id: string;
  slug: string;
  contentType: string;
  title: string;
  summary: string;
  tags: string[];
  score: number;
  factors: ScoreFactor[];
  href: string;
  country?: string | null;
  region?: string | null;
  organizationName?: string | null;
  coverImageUrl?: string | null;
};

export type SearchResponse = {
  interpretation: ReturnType<typeof interpretQuery>;
  total: number;
  facets: {
    solutions: number;
    projects: number;
    organizations: number;
    funders: number;
    cases: number;
    challenges: number;
  };
  results: SearchResultItem[];
  paths: {
    whoCanSolve: Array<{ organizationId: string; name: string; score: number; slug?: string }>;
    whoCanFund: Array<{ id: string; kind: 'ACTIVE_OFFER' | 'DIRECTORY'; name: string; score: number; slug?: string }>;
    relatedProjects: Array<{ id: string; type: string; title: string; score: number; slug?: string }>;
  };
  meta: {
    minScore: number;
    mode: 'hybrid' | 'keyword';
    provider: string;
  };
};

type Candidate = {
  id: string;
  slug: string;
  contentType: string;
  title: string;
  summary: string;
  tags: string[];
  country?: string | null;
  region?: string | null;
  maturity?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  organizationSlug?: string | null;
  projectType?: string | null;
  vector?: number[] | null;
  textBlob: string;
  href: string;
  coverImageUrl?: string | null;
};

function asVector(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  return value.map((n) => Number(n)).filter((n) => !Number.isNaN(n));
}

const SEARCH_TYPE_MAP: Record<string, TranslationEntityType> = {
  SOLUTION: 'technology',
  PROJECT: 'project',
  ORGANIZATION: 'organization',
  FUNDER: 'funder',
  CASE: 'success_case',
  CHALLENGE: 'challenge',
};

function candidateTranslationType(c: Candidate): TranslationEntityType | null {
  if (c.contentType === 'FUNDER' && c.tags.includes('active')) return 'funding_offer';
  return SEARCH_TYPE_MAP[c.contentType] ?? null;
}

/**
 * Acrescenta textos EN/ES (e demais langs) de ContentTranslation ao textBlob,
 * para keyword matching cross-lang numa única passagem.
 */
async function enrichCandidatesWithTranslations(candidates: Candidate[]): Promise<void> {
  if (!candidates.length) return;

  const byType = new Map<TranslationEntityType, string[]>();
  for (const c of candidates) {
    const type = candidateTranslationType(c);
    if (!type) continue;
    const list = byType.get(type) ?? [];
    list.push(c.id);
    byType.set(type, list);
  }
  if (!byType.size) return;

  const rows = await prisma.contentTranslation.findMany({
    where: {
      OR: [...byType.entries()].map(([entityType, entityIds]) => ({
        entityType,
        entityId: { in: entityIds },
      })),
    },
    select: { entityId: true, value: true },
  });
  if (!rows.length) return;

  const extras = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.value?.trim()) continue;
    const list = extras.get(row.entityId) ?? [];
    list.push(row.value);
    extras.set(row.entityId, list);
  }

  for (const c of candidates) {
    const parts = extras.get(c.id);
    if (parts?.length) {
      c.textBlob = `${c.textBlob} ${parts.join(' ')}`;
    }
  }
}

async function localizeSearchResults(items: SearchResultItem[], lang: string): Promise<SearchResultItem[]> {
  const groups = new Map<TranslationEntityType, SearchResultItem[]>();
  for (const item of items) {
    const type = SEARCH_TYPE_MAP[item.contentType];
    if (!type) continue;
    const list = groups.get(type) ?? [];
    list.push(item);
    groups.set(type, list);
  }
  const overlays = new Map<string, { title: string; summary: string }>();
  for (const [type, group] of groups) {
    const localized = await localizeEntities(type, group, lang);
    for (const row of localized) {
      overlays.set(row.id, { title: row.title, summary: row.summary });
    }
  }
  return items.map((item) => {
    const hit = overlays.get(item.id);
    return hit ? { ...item, title: hit.title, summary: hit.summary } : item;
  });
}

export async function runSearch(body: SearchBody): Promise<SearchResponse> {
  const query = (body.query ?? '').trim();
  const filters = body.filters ?? {};
  const lang = body.lang ?? 'pt';
  const limit = body.limit ?? 20;
  const minScore = env.matchMinScore;
  const weights = getScoreWeights(env.scoreWeights);
  const provider = getEmbeddingProvider();
  const queryTokens = tokenize(query);

  let queryVector: number[] | null = null;
  let mode: 'hybrid' | 'keyword' = 'keyword';
  try {
    if (query) {
      queryVector = await provider.embed(query);
      mode = provider.name.startsWith('keyword') ? 'keyword' : 'hybrid';
    }
  } catch (error) {
    console.warn('[search] embed query failed, keyword only', error);
    mode = 'keyword';
  }

  const contentFilter = filters.contentType && filters.contentType !== 'ALL' ? filters.contentType : null;

  const [technologies, projects, organizations, funders, offers, challenges, cases] = await Promise.all([
    contentFilter && contentFilter !== 'SOLUTION'
      ? Promise.resolve([])
      : prisma.technology.findMany({
          where: {
            status: ContentStatus.PUBLISHED,
            ...(filters.country ? { country: filters.country } : {}),
            ...(filters.region ? { region: filters.region } : {}),
            ...(filters.theme
              ? { climateAction: filters.theme as 'ADAPTATION' | 'MITIGATION' | 'BOTH' }
              : {}),
            ...(filters.maturity ? { maturity: filters.maturity as never } : {}),
          },
          include: { tags: true, organization: true, embedding: true },
          take: 100,
        }),
    contentFilter && contentFilter !== 'PROJECT'
      ? Promise.resolve([])
      : prisma.project.findMany({
          where: {
            status: ContentStatus.PUBLISHED,
            ...(filters.country ? { country: filters.country } : {}),
            ...(filters.region ? { region: filters.region } : {}),
          },
          include: { organization: true, embedding: true },
          take: 100,
        }),
    contentFilter && contentFilter !== 'ORGANIZATION'
      ? Promise.resolve([])
      : prisma.organization.findMany({
          where: {
            ...(filters.country ? { country: filters.country } : {}),
            ...(filters.region ? { region: filters.region } : {}),
          },
          take: 100,
        }),
    contentFilter && contentFilter !== 'FUNDER'
      ? Promise.resolve([])
      : prisma.funderProfile.findMany({
          where: {
            status: ContentStatus.PUBLISHED,
            ...(filters.country ? { country: filters.country } : {}),
            ...(filters.region ? { region: filters.region } : {}),
          },
          take: 50,
        }),
    contentFilter && contentFilter !== 'FUNDER'
      ? Promise.resolve([])
      : prisma.fundingOffer.findMany({
          where: {
            status: ContentStatus.PUBLISHED,
            ...(filters.country ? { country: filters.country } : {}),
            ...(filters.region ? { region: filters.region } : {}),
            OR: [{ deadline: null }, { deadline: { gte: new Date() } }],
          },
          take: 50,
        }),
    contentFilter && contentFilter !== 'CHALLENGE'
      ? Promise.resolve([])
      : prisma.challenge.findMany({
          where: {
            status: ContentStatus.PUBLISHED,
            ...(filters.country ? { country: filters.country } : {}),
            ...(filters.region ? { region: filters.region } : {}),
          },
          include: { tags: true, organization: true, embedding: true },
          take: 50,
        }),
    contentFilter && contentFilter !== 'CASE'
      ? Promise.resolve([])
      : prisma.successCase.findMany({
          where: {
            status: ContentStatus.PUBLISHED,
            ...(filters.country ? { country: filters.country } : {}),
            ...(filters.region ? { region: filters.region } : {}),
          },
          include: { organization: true, needs: true },
          take: 50,
        }),
  ]);

  const candidates: Candidate[] = [];

  for (const tech of technologies) {
    const tags = tech.tags.map((t) => t.tag);
    if (filters.sector && !tags.some((t) => t.toLowerCase().includes(filters.sector!.toLowerCase()))) {
      continue;
    }
    if (filters.scale && !tags.some((t) => tokenize(t).includes(filters.scale!.toLowerCase()))) {
      // soft: if scale filter set and no tag match, skip unless empty tags
      if (tags.length) continue;
    }
    if (filters.actorType) {
      const actor = filters.actorType.toLowerCase();
      const orgBlob = `${tech.organization.name} ${tech.organization.summary ?? ''}`.toLowerCase();
      if (!orgBlob.includes(actor) && !['ict', 'pesquisa', 'research'].some((k) => actor.includes(k))) {
        // keep research orgs loosely
        if (!['embrapa', 'iita', 'cirad'].includes(tech.organization.slug)) continue;
      }
    }
    candidates.push({
      id: tech.id,
      slug: tech.slug,
      contentType: 'SOLUTION',
      title: tech.title,
      summary: tech.summary,
      tags,
      country: tech.country,
      region: tech.region,
      maturity: tech.maturity,
      organizationId: tech.organizationId,
      organizationName: tech.organization.name,
      organizationSlug: tech.organization.slug,
      vector: asVector(tech.embedding?.vector),
      textBlob: `${tech.title} ${tech.summary} ${tech.problemStatement} ${tech.howItWorks} ${tags.join(' ')}`,
      href: `/solutions/${tech.slug}`,
      coverImageUrl: tech.coverImageUrl,
    });
  }

  for (const project of projects) {
    candidates.push({
      id: project.id,
      slug: project.slug,
      contentType: 'PROJECT',
      title: project.title,
      summary: project.summary,
      tags: [project.type.toLowerCase()],
      country: project.country,
      region: project.region,
      organizationId: project.organizationId,
      organizationName: project.organization.name,
      organizationSlug: project.organization.slug,
      projectType: project.type,
      vector: asVector(project.embedding?.vector),
      textBlob: `${project.title} ${project.summary} ${project.type}`,
      href: `/projects/${project.slug}`,
      coverImageUrl: project.coverImageUrl,
    });
  }

  for (const org of organizations) {
    candidates.push({
      id: org.id,
      slug: org.slug,
      contentType: 'ORGANIZATION',
      title: org.name,
      summary: org.summary ?? '',
      tags: [],
      country: org.country,
      region: org.region,
      organizationId: org.id,
      organizationName: org.name,
      organizationSlug: org.slug,
      textBlob: `${org.name} ${org.summary ?? ''}`,
      href: `/organizations/${org.slug}`,
      coverImageUrl: org.logoUrl,
    });
  }

  for (const funder of funders) {
    // Directory only — browsable, never match path whoCanFund
    candidates.push({
      id: funder.id,
      slug: funder.slug,
      contentType: 'FUNDER',
      title: funder.name,
      summary: funder.summary,
      tags: ['financiador', 'directory'],
      country: funder.country,
      region: funder.region,
      textBlob: `${funder.name} ${funder.summary}`,
      href: `/funding?tab=directory`,
    });
  }

  for (const offer of offers) {
    candidates.push({
      id: offer.id,
      slug: offer.slug,
      contentType: 'FUNDER',
      title: offer.title,
      summary: offer.summary,
      tags: ['oferta', 'financiamento', 'active'],
      country: offer.country,
      region: offer.region,
      organizationId: offer.organizationId,
      textBlob: `${offer.title} ${offer.summary} ${offer.whatFunds ?? ''} ${offer.criteria ?? ''}`,
      href: `/funding/${offer.slug}`,
      coverImageUrl: offer.coverImageUrl,
    });
  }

  for (const challenge of challenges) {
    const tags = challenge.tags.map((t) => t.tag);
    candidates.push({
      id: challenge.id,
      slug: challenge.slug,
      contentType: 'CHALLENGE',
      title: challenge.title,
      summary: challenge.summary,
      tags,
      country: challenge.country,
      region: challenge.region,
      organizationId: challenge.organizationId,
      organizationName: challenge.organization.name,
      organizationSlug: challenge.organization.slug,
      vector: asVector(challenge.embedding?.vector),
      textBlob: `${challenge.title} ${challenge.summary} ${challenge.context ?? ''} ${tags.join(' ')}`,
      href: `/challenges/${challenge.slug}`,
      coverImageUrl: challenge.coverImageUrl,
    });
  }

  for (const successCase of cases) {
    const needTags = successCase.needs.map((n) => n.needType.toLowerCase());
    candidates.push({
      id: successCase.id,
      slug: successCase.slug,
      contentType: 'CASE',
      title: successCase.title,
      summary: successCase.summary,
      tags: ['caso', ...needTags],
      country: successCase.country,
      region: successCase.region,
      organizationId: successCase.organizationId,
      organizationName: successCase.organization.name,
      organizationSlug: successCase.organization.slug,
      textBlob: `${successCase.title} ${successCase.summary} ${successCase.context ?? ''} ${successCase.outcomes ?? ''} ${needTags.join(' ')}`,
      href: `/cases/${successCase.slug}`,
      coverImageUrl: successCase.coverImageUrl,
    });
  }

  if (filters.financing === 'WITH_OPPORTUNITY') {
    const offerIds = new Set(offers.map((o) => o.id));
    const filtered = candidates.filter((c) => offerIds.has(c.id) && c.tags.includes('active'));
    candidates.length = 0;
    candidates.push(...filtered);
  }

  await enrichCandidatesWithTranslations(candidates);

  const scored: SearchResultItem[] = [];

  for (const c of candidates) {
    const kw = keywordOverlap(queryTokens, c.textBlob);
    const semantic =
      queryVector && c.vector?.length ? Math.max(kw, cosineSimilarity(queryVector, c.vector)) : kw;
    const tags = tagOverlap(queryTokens, c.tags);
    const region = regionScore(queryTokens, c.country, c.region);
    const maturity = maturityScore(c.maturity);
    const need = needScore(c.contentType, queryTokens);
    const { score, factors } = composeScore({
      semantic,
      tags,
      region,
      maturity,
      need,
      weights,
    });
    scored.push({
      id: c.id,
      slug: c.slug,
      contentType: c.contentType,
      title: c.title,
      summary: c.summary,
      tags: c.tags,
      score,
      factors,
      href: c.href,
      country: c.country,
      region: c.region,
      organizationName: c.organizationName,
      coverImageUrl: c.coverImageUrl ?? null,
    });
  }

  applyAnchorCalibration(query, scored);
  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  const qualified = scored.filter((r) => r.score >= minScore);
  const visible = qualified.slice(0, limit);

  // Facets mirror the same pool as `total` (above minScore), so cards stay truthful.
  const facets = {
    solutions: qualified.filter((r) => r.contentType === 'SOLUTION').length,
    projects: qualified.filter((r) => r.contentType === 'PROJECT').length,
    organizations: qualified.filter((r) => r.contentType === 'ORGANIZATION').length,
    funders: qualified.filter((r) => r.contentType === 'FUNDER').length,
    cases: qualified.filter((r) => r.contentType === 'CASE').length,
    challenges: qualified.filter((r) => r.contentType === 'CHALLENGE').length,
  };

  // Paths from full scored set (above threshold)
  const pathPool = qualified;
  const whoCanSolveMap = new Map<string, { organizationId: string; name: string; score: number; slug?: string }>();
  for (const c of candidates) {
    if (c.contentType !== 'SOLUTION' || !c.organizationId || !c.organizationName) continue;
    const item = pathPool.find((r) => r.id === c.id);
    if (!item) continue;
    const prev = whoCanSolveMap.get(c.organizationId);
    if (!prev || item.score > prev.score) {
      whoCanSolveMap.set(c.organizationId, {
        organizationId: c.organizationId,
        name: c.organizationName,
        score: item.score,
        slug: c.organizationSlug ?? undefined,
      });
    }
  }

  // E5 rule: whoCanFund = active offers ONLY (directory ≠ open call)
  const whoCanFund: SearchResponse['paths']['whoCanFund'] = [];
  for (const offer of offers) {
    const item = pathPool.find((r) => r.id === offer.id);
    whoCanFund.push({
      id: offer.id,
      kind: 'ACTIVE_OFFER',
      name: offer.title,
      score: item?.score ?? Math.max(minScore, 70),
      slug: offer.slug,
    });
  }
  whoCanFund.sort((a, b) => b.score - a.score);

  const relatedProjects = pathPool
    .filter((r) => r.contentType === 'PROJECT')
    .map((r) => {
      const c = candidates.find((x) => x.id === r.id);
      return {
        id: r.id,
        type: c?.projectType ?? 'PROJECT',
        title: r.title,
        score: r.score,
        slug: r.slug,
      };
    })
    .slice(0, 8);

  const [localizedVisible, localizedOffers, localizedRelated] = await Promise.all([
    localizeSearchResults(visible, lang),
    whoCanFund.length
      ? localizeEntities(
          'funding_offer',
          whoCanFund.map((offer) => ({ id: offer.id, title: offer.name, summary: '' })),
          lang,
        )
      : Promise.resolve([]),
    relatedProjects.length
      ? localizeEntities(
          'project',
          relatedProjects.map((project) => ({ id: project.id, title: project.title, summary: '' })),
          lang,
        )
      : Promise.resolve([]),
  ]);
  const offerTitles = new Map(localizedOffers.map((offer) => [offer.id, offer.title]));
  const projectTitles = new Map(localizedRelated.map((project) => [project.id, project.title]));

  return {
    interpretation: interpretQuery(query, lang),
    total: qualified.length,
    facets,
    results: localizedVisible,
    paths: {
      whoCanSolve: [...whoCanSolveMap.values()].sort((a, b) => b.score - a.score).slice(0, 8),
      whoCanFund: whoCanFund.slice(0, 8).map((offer) => ({
        ...offer,
        name: offerTitles.get(offer.id) ?? offer.name,
      })),
      relatedProjects: relatedProjects.map((project) => ({
        ...project,
        title: projectTitles.get(project.id) ?? project.title,
      })),
    },
    meta: {
      minScore,
      mode,
      provider: provider.name,
    },
  };
}

export async function runMatchForChallenge(challengeIdOrSlug: string): Promise<SearchResponse> {
  const challenge = await prisma.challenge.findFirst({
    where: {
      OR: [{ id: challengeIdOrSlug }, { slug: challengeIdOrSlug }],
      status: ContentStatus.PUBLISHED,
    },
    include: { tags: true },
  });
  if (!challenge) {
    const err = new Error('not_found');
    (err as Error & { status: number }).status = 404;
    throw err;
  }
  const query = [challenge.title, challenge.summary, challenge.context, ...challenge.tags.map((t) => t.tag)]
    .filter(Boolean)
    .join(' ');
  return runSearch({ query, filters: {}, limit: 20 });
}
