import { Router } from 'express';
import { ContentStatus, updateHighlightsBodySchema, type HighlightType } from '@cac/shared';
import { prisma } from '../../lib/prisma.js';
import { validateBody } from '../../middleware/validate.js';
import { localizeEntities, requestLang } from '../../lib/translation/index.js';

export const highlightsRouter = Router();
export const adminHighlightsRouter = Router();

/** Limite de cards exibidos no bloco "Destaques da plataforma". */
const MAX_HIGHLIGHTS = 6;

type HighlightRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  cardImageUrl: string | null;
  cardTitle: string | null;
  cardSummary: string | null;
  highlightOrder: number | null;
  updatedAt: Date;
  organization?: { id: string; name: string } | null;
};

export type HighlightItem = {
  type: HighlightType;
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImageUrl: string | null;
  cardImageUrl: string | null;
  cardTitle: string | null;
  cardSummary: string | null;
  highlightOrder: number | null;
  updatedAt: Date;
  organizationName: string | null;
};

const highlightSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  coverImageUrl: true,
  cardImageUrl: true,
  cardTitle: true,
  cardSummary: true,
  highlightOrder: true,
  updatedAt: true,
  organization: { select: { id: true, name: true } },
} as const;

function toItem(type: HighlightType, row: HighlightRow): HighlightItem {
  return {
    type,
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    coverImageUrl: row.coverImageUrl,
    cardImageUrl: row.cardImageUrl,
    cardTitle: row.cardTitle,
    cardSummary: row.cardSummary,
    highlightOrder: row.highlightOrder,
    updatedAt: row.updatedAt,
    organizationName: row.organization?.name ?? null,
  };
}

async function loadPublished(where: { highlightOrder?: { not: null } | null }, take: number) {
  const base = { status: ContentStatus.PUBLISHED, ...where };
  const orderBy = where.highlightOrder ? { highlightOrder: 'asc' as const } : { updatedAt: 'desc' as const };
  const [solutions, offers, cases] = await Promise.all([
    prisma.technology.findMany({ where: base, select: highlightSelect, orderBy, take }),
    prisma.fundingOffer.findMany({ where: base, select: highlightSelect, orderBy, take }),
    prisma.successCase.findMany({ where: base, select: highlightSelect, orderBy, take }),
  ]);
  return { solutions, offers, cases };
}

async function localizeItems(items: HighlightItem[], lang: string): Promise<HighlightItem[]> {
  const byType = (type: HighlightType) => items.filter((item) => item.type === type);
  const [solutions, offers, cases] = await Promise.all([
    localizeEntities('technology', byType('SOLUTION'), lang),
    localizeEntities('funding_offer', byType('FUNDING_OFFER'), lang),
    localizeEntities('success_case', byType('SUCCESS_CASE'), lang),
  ]);
  const localized = new Map([...solutions, ...offers, ...cases].map((item) => [`${item.type}:${item.id}`, item]));
  return items.map((item) => localized.get(`${item.type}:${item.id}`) ?? item);
}

/** Intercala tipos (solução, financiamento, caso) para o modo automático. */
function interleave(groups: HighlightItem[][], limit: number): HighlightItem[] {
  const out: HighlightItem[] = [];
  for (let i = 0; out.length < limit; i++) {
    let added = false;
    for (const group of groups) {
      if (group[i] && out.length < limit) {
        out.push(group[i]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

highlightsRouter.get('/', async (req, res, next) => {
  try {
    const lang = requestLang(req.query);
    const curated = await loadPublished({ highlightOrder: { not: null } }, MAX_HIGHLIGHTS);
    const curatedItems = [
      ...curated.solutions.map((row) => toItem('SOLUTION', row)),
      ...curated.offers.map((row) => toItem('FUNDING_OFFER', row)),
      ...curated.cases.map((row) => toItem('SUCCESS_CASE', row)),
    ]
      .sort((a, b) => (a.highlightOrder ?? 0) - (b.highlightOrder ?? 0))
      .slice(0, MAX_HIGHLIGHTS);

    if (curatedItems.length) {
      res.json({ mode: 'curated', items: await localizeItems(curatedItems, lang) });
      return;
    }

    const latest = await loadPublished({}, 3);
    const autoItems = interleave(
      [
        latest.solutions.map((row) => toItem('SOLUTION', row)),
        latest.offers.map((row) => toItem('FUNDING_OFFER', row)),
        latest.cases.map((row) => toItem('SUCCESS_CASE', row)),
      ],
      3,
    );
    res.json({ mode: 'auto', items: await localizeItems(autoItems, lang) });
  } catch (error) {
    next(error);
  }
});

async function adminPayload() {
  const [selected, all] = await Promise.all([
    loadPublished({ highlightOrder: { not: null } }, 50),
    loadPublished({ highlightOrder: null }, 200),
  ]);
  return {
    max: MAX_HIGHLIGHTS,
    selected: [
      ...selected.solutions.map((row) => toItem('SOLUTION', row)),
      ...selected.offers.map((row) => toItem('FUNDING_OFFER', row)),
      ...selected.cases.map((row) => toItem('SUCCESS_CASE', row)),
    ].sort((a, b) => (a.highlightOrder ?? 0) - (b.highlightOrder ?? 0)),
    available: [
      ...all.solutions.map((row) => toItem('SOLUTION', row)),
      ...all.offers.map((row) => toItem('FUNDING_OFFER', row)),
      ...all.cases.map((row) => toItem('SUCCESS_CASE', row)),
    ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()),
  };
}

adminHighlightsRouter.get('/', async (_req, res, next) => {
  try {
    res.json(await adminPayload());
  } catch (error) {
    next(error);
  }
});

adminHighlightsRouter.put('/', validateBody(updateHighlightsBodySchema), async (req, res, next) => {
  try {
    const items = (req.body.items as Array<{ type: HighlightType; id: string }>).slice(0, MAX_HIGHLIGHTS);
    const published = { status: ContentStatus.PUBLISHED };

    await prisma.$transaction(async (tx) => {
      await tx.technology.updateMany({ where: { highlightOrder: { not: null } }, data: { highlightOrder: null } });
      await tx.fundingOffer.updateMany({ where: { highlightOrder: { not: null } }, data: { highlightOrder: null } });
      await tx.successCase.updateMany({ where: { highlightOrder: { not: null } }, data: { highlightOrder: null } });

      for (const [index, item] of items.entries()) {
        const where = { id: item.id, ...published };
        const data = { highlightOrder: index + 1 };
        if (item.type === 'SOLUTION') await tx.technology.updateMany({ where, data });
        if (item.type === 'FUNDING_OFFER') await tx.fundingOffer.updateMany({ where, data });
        if (item.type === 'SUCCESS_CASE') await tx.successCase.updateMany({ where, data });
      }
    });

    res.json(await adminPayload());
  } catch (error) {
    next(error);
  }
});
