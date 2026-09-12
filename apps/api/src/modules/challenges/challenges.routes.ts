import { Router } from 'express';
import { ContentStatus, createChallengeBodySchema, updateChallengeBodySchema } from '@cac/shared';
import { assertCanActForOrganization, assertCanPublishKind } from '../../lib/org-access.js';
import { prisma } from '../../lib/prisma.js';
import { slugify } from '../../lib/slug.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { isUuid, param } from '../../lib/params.js';
import { enqueueEmbedding } from '../../lib/queue/embedding-queue.js';
import { enqueueTranslation, enqueueTranslationIfPublished, localizeEntities, localizeOne, requestLang } from '../../lib/translation/index.js';

export const challengesRouter = Router();

function mapChallenge(item: {
  id: string;
  tags?: { tag: string }[];
  [key: string]: unknown;
}) {
  return { ...item, tags: item.tags?.map((t) => t.tag) ?? [] };
}

challengesRouter.get('/', async (req, res, next) => {
  try {
    const items = await prisma.challenge.findMany({
      where: { status: ContentStatus.PUBLISHED },
      include: { tags: true, organization: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json({
      items: await localizeEntities('challenge', items.map(mapChallenge), requestLang(req.query), {
        nestedOrganization: true,
      }),
    });
  } catch (error) {
    next(error);
  }
});

challengesRouter.get('/:slugOrId', async (req, res, next) => {
  try {
    const key = param(req.params.slugOrId);
    const item = await prisma.challenge.findFirst({
      where: isUuid(key) ? { OR: [{ slug: key }, { id: key }] } : { slug: key },
      include: { tags: true, organization: true },
    });
    if (!item || item.status !== ContentStatus.PUBLISHED) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({
      challenge: await localizeOne('challenge', mapChallenge(item), requestLang(req.query), {
        nestedOrganization: true,
      }),
    });
  } catch (error) {
    next(error);
  }
});

challengesRouter.post('/', requireAuth, validateBody(createChallengeBodySchema), async (req, res, next) => {
  try {
    await assertCanPublishKind(req.auth!.sub, req.body.organizationId, req.auth!.role, 'CHALLENGE');
    const status = req.body.status ?? ContentStatus.DRAFT;
    if (status === ContentStatus.PUBLISHED) {
      res.status(400).json({ error: 'workflow_required' });
      return;
    }
    const slug = req.body.slug || slugify(req.body.title);
    const challenge = await prisma.challenge.create({
      data: {
        title: req.body.title,
        slug,
        summary: req.body.summary,
        context: req.body.context,
        needType: req.body.needType,
        organizationId: req.body.organizationId,
        country: req.body.country,
        region: req.body.region,
        status,
        tags: req.body.tags?.length
          ? { create: req.body.tags.map((tag: string) => ({ tag })) }
          : undefined,
      },
      include: { tags: true },
    });
    res.status(201).json({ challenge: mapChallenge(challenge) });
  } catch (error) {
    next(error);
  }
});

challengesRouter.patch(
  '/:id',
  requireAuth,
  validateBody(updateChallengeBodySchema),
  async (req, res, next) => {
    try {
      const current = await prisma.challenge.findUnique({ where: { id: param(req.params.id) } });
      if (!current) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
      if (req.body.status === ContentStatus.PUBLISHED) {
        res.status(400).json({ error: 'workflow_required' });
        return;
      }
      const challenge = await prisma.challenge.update({
        where: { id: current.id },
        data: {
          title: req.body.title,
          slug: req.body.slug,
          summary: req.body.summary,
          context: req.body.context,
          needType: req.body.needType,
          country: req.body.country,
          region: req.body.region,
          bannerLinkUrl:
            req.body.bannerLinkUrl === undefined
              ? undefined
              : req.body.bannerLinkUrl === null || req.body.bannerLinkUrl === ''
                ? null
                : String(req.body.bannerLinkUrl).trim(),
          status: req.body.status,
          tags: req.body.tags
            ? {
                deleteMany: {},
                create: req.body.tags.map((tag: string) => ({ tag })),
              }
            : undefined,
        },
        include: { tags: true },
      });
      void enqueueTranslationIfPublished(challenge.status, {
        entityType: 'challenge',
        entityId: challenge.id,
      });
      res.json({ challenge: mapChallenge(challenge) });
    } catch (error) {
      next(error);
    }
  },
);

challengesRouter.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const current = await prisma.challenge.findUnique({ where: { id: param(req.params.id) } });
    if (!current) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
    if (current.status !== ContentStatus.DRAFT) {
      res.status(400).json({ error: 'invalid_status' });
      return;
    }
    const challenge = await prisma.challenge.update({
      where: { id: current.id },
      data: { status: ContentStatus.IN_REVIEW },
      include: { tags: true },
    });
    res.json({ challenge: mapChallenge(challenge) });
  } catch (error) {
    next(error);
  }
});

challengesRouter.post('/:id/publish', requireAuth, async (req, res, next) => {
  try {
    if (req.auth!.role !== 'ADMIN' && req.auth!.role !== 'CURADOR') {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const current = await prisma.challenge.findUnique({ where: { id: param(req.params.id) } });
    if (!current || current.status !== ContentStatus.IN_REVIEW) {
      res.status(400).json({ error: 'invalid_status' });
      return;
    }
    const challenge = await prisma.challenge.update({
      where: { id: current.id },
      data: { status: ContentStatus.PUBLISHED },
      include: { tags: true },
    });
    void enqueueEmbedding({ entityType: 'challenge', entityId: challenge.id });
    void enqueueTranslation({ entityType: 'challenge', entityId: challenge.id });
    res.json({ challenge: mapChallenge(challenge) });
  } catch (error) {
    next(error);
  }
});
