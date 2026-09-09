import { Router } from 'express';
import {
  ContentStatus,
  createTechnologyBodySchema,
  updateTechnologyBodySchema,
  UserRole,
} from '@cac/shared';
import { assertCanActForOrganization } from '../../lib/org-access.js';
import { prisma } from '../../lib/prisma.js';
import { slugify } from '../../lib/slug.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { isUuid, param } from '../../lib/params.js';
import { enqueueEmbedding } from '../../lib/queue/embedding-queue.js';

export const technologiesRouter = Router();

function mapTech(tech: {
  id: string;
  title: string;
  slug: string;
  summary: string;
  problemStatement: string;
  howItWorks: string;
  videoUrl?: string | null;
  status: string;
  organizationId: string;
  country: string;
  region: string | null;
  climateAction: string | null;
  maturity: string | null;
  tags?: { tag: string }[];
  media?: unknown[];
  organization?: unknown;
}) {
  return {
    ...tech,
    tags: tech.tags?.map((t) => t.tag) ?? [],
  };
}

function normalizeVideoUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return String(value).trim();
}

technologiesRouter.get('/', async (req, res, next) => {
  try {
    const includeDrafts = req.query.all === '1';
    const items = await prisma.technology.findMany({
      where: includeDrafts ? undefined : { status: ContentStatus.PUBLISHED },
      include: { tags: true, organization: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json({ items: items.map(mapTech) });
  } catch (error) {
    next(error);
  }
});

technologiesRouter.get('/:slugOrId', async (req, res, next) => {
  try {
    const key = param(req.params.slugOrId);
    const item = await prisma.technology.findFirst({
      where: isUuid(key) ? { OR: [{ slug: key }, { id: key }] } : { slug: key },
      include: { tags: true, media: true, organization: true },
    });
    if (!item) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    if (item.status !== ContentStatus.PUBLISHED) {
      // public endpoint: hide non-published unless later auth middleware added
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({ technology: mapTech(item) });
  } catch (error) {
    next(error);
  }
});

technologiesRouter.post('/', requireAuth, validateBody(createTechnologyBodySchema), async (req, res, next) => {
  try {
    await assertCanActForOrganization(req.auth!.sub, req.body.organizationId, req.auth!.role);
    const slug = req.body.slug || slugify(req.body.title);
    const existing = await prisma.technology.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: 'slug_taken' });
      return;
    }

    const technology = await prisma.technology.create({
      data: {
        title: req.body.title,
        slug,
        summary: req.body.summary,
        problemStatement: req.body.problemStatement,
        howItWorks: req.body.howItWorks,
        videoUrl: normalizeVideoUrl(req.body.videoUrl) ?? null,
        organizationId: req.body.organizationId,
        country: req.body.country,
        region: req.body.region,
        climateAction: req.body.climateAction,
        maturity: req.body.maturity,
        status: ContentStatus.DRAFT,
        tags: req.body.tags?.length
          ? { create: req.body.tags.map((tag: string) => ({ tag })) }
          : undefined,
      },
      include: { tags: true },
    });
    res.status(201).json({ technology: mapTech(technology) });
  } catch (error) {
    next(error);
  }
});

technologiesRouter.patch(
  '/:id',
  requireAuth,
  validateBody(updateTechnologyBodySchema),
  async (req, res, next) => {
    try {
      const current = await prisma.technology.findUnique({ where: { id: param(req.params.id) } });
      if (!current) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
      if (current.status === ContentStatus.PUBLISHED && req.auth!.role === UserRole.ORG_MEMBER) {
        res.status(403).json({ error: 'published_locked' });
        return;
      }

      const technology = await prisma.technology.update({
        where: { id: current.id },
        data: {
          title: req.body.title,
          summary: req.body.summary,
          problemStatement: req.body.problemStatement,
          howItWorks: req.body.howItWorks,
          videoUrl: normalizeVideoUrl(req.body.videoUrl),
          country: req.body.country,
          region: req.body.region,
          climateAction: req.body.climateAction,
          maturity: req.body.maturity,
          slug: req.body.slug,
          tags: req.body.tags
            ? {
                deleteMany: {},
                create: req.body.tags.map((tag: string) => ({ tag })),
              }
            : undefined,
        },
        include: { tags: true },
      });
      res.json({ technology: mapTech(technology) });
    } catch (error) {
      next(error);
    }
  },
);

technologiesRouter.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const current = await prisma.technology.findUnique({ where: { id: param(req.params.id) } });
    if (!current) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
    if (current.status !== ContentStatus.DRAFT) {
      res.status(400).json({ error: 'invalid_status' });
      return;
    }
    const technology = await prisma.technology.update({
      where: { id: current.id },
      data: { status: ContentStatus.IN_REVIEW },
      include: { tags: true },
    });
    res.json({ technology: mapTech(technology) });
  } catch (error) {
    next(error);
  }
});

technologiesRouter.post(
  '/:id/publish',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.CURADOR),
  async (req, res, next) => {
    try {
      const current = await prisma.technology.findUnique({ where: { id: param(req.params.id) } });
      if (!current) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      if (current.status !== ContentStatus.IN_REVIEW) {
        res.status(400).json({ error: 'invalid_status' });
        return;
      }
      const technology = await prisma.technology.update({
        where: { id: current.id },
        data: { status: ContentStatus.PUBLISHED },
        include: { tags: true },
      });
      void enqueueEmbedding({ entityType: 'technology', entityId: technology.id });
      res.json({ technology: mapTech(technology) });
    } catch (error) {
      next(error);
    }
  },
);
