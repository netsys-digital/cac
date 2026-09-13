import { Router } from 'express';
import { ConnectionTargetType, followBodySchema, savedItemBodySchema } from '@cac/shared';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { param } from '../../lib/params.js';

export const savedItemsRouter = Router();
export const followsRouter = Router();

savedItemsRouter.use(requireAuth);
followsRouter.use(requireAuth);

type SavedTarget = {
  title: string;
  slug: string | null;
  summary: string | null;
  coverImageUrl: string | null;
  organizationName: string | null;
  portalPath: string | null;
};

async function resolveSavedTarget(targetType: string, targetId: string): Promise<SavedTarget | null> {
  switch (targetType) {
    case ConnectionTargetType.TECHNOLOGY: {
      const item = await prisma.technology.findUnique({
        where: { id: targetId },
        select: {
          title: true,
          slug: true,
          summary: true,
          coverImageUrl: true,
          organization: { select: { name: true } },
        },
      });
      if (!item) return null;
      return {
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        coverImageUrl: item.coverImageUrl,
        organizationName: item.organization.name,
        portalPath: `/solutions/${item.slug}`,
      };
    }
    case ConnectionTargetType.PROJECT: {
      const item = await prisma.project.findUnique({
        where: { id: targetId },
        select: {
          title: true,
          slug: true,
          summary: true,
          coverImageUrl: true,
          organization: { select: { name: true } },
        },
      });
      if (!item) return null;
      return {
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        coverImageUrl: item.coverImageUrl,
        organizationName: item.organization.name,
        portalPath: `/projects/${item.slug}`,
      };
    }
    case ConnectionTargetType.CHALLENGE: {
      const item = await prisma.challenge.findUnique({
        where: { id: targetId },
        select: {
          title: true,
          slug: true,
          summary: true,
          coverImageUrl: true,
          organization: { select: { name: true } },
        },
      });
      if (!item) return null;
      return {
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        coverImageUrl: item.coverImageUrl,
        organizationName: item.organization.name,
        portalPath: `/challenges/${item.slug}`,
      };
    }
    case ConnectionTargetType.FUNDING_OFFER: {
      const item = await prisma.fundingOffer.findUnique({
        where: { id: targetId },
        select: {
          title: true,
          slug: true,
          summary: true,
          coverImageUrl: true,
          organization: { select: { name: true } },
        },
      });
      if (!item) return null;
      return {
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        coverImageUrl: item.coverImageUrl,
        organizationName: item.organization.name,
        portalPath: `/funding/${item.slug}`,
      };
    }
    case ConnectionTargetType.SUCCESS_CASE: {
      const item = await prisma.successCase.findUnique({
        where: { id: targetId },
        select: {
          title: true,
          slug: true,
          summary: true,
          coverImageUrl: true,
          organization: { select: { name: true } },
        },
      });
      if (!item) return null;
      return {
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        coverImageUrl: item.coverImageUrl,
        organizationName: item.organization.name,
        portalPath: `/cases/${item.slug}`,
      };
    }
    case ConnectionTargetType.ORGANIZATION: {
      const item = await prisma.organization.findUnique({
        where: { id: targetId },
        select: { name: true, slug: true, summary: true, logoUrl: true },
      });
      if (!item) return null;
      return {
        title: item.name,
        slug: item.slug,
        summary: item.summary,
        coverImageUrl: item.logoUrl,
        organizationName: item.name,
        portalPath: `/organizations/${item.slug}`,
      };
    }
    default:
      return null;
  }
}

savedItemsRouter.get('/', async (req, res, next) => {
  try {
    const targetType = typeof req.query.targetType === 'string' ? req.query.targetType : undefined;
    const targetId = typeof req.query.targetId === 'string' ? req.query.targetId : undefined;
    const filtered = Boolean(targetType && targetId);

    const rows = await prisma.savedItem.findMany({
      where: {
        userId: req.auth!.sub,
        ...(filtered
          ? {
              targetType: targetType as (typeof ConnectionTargetType)[keyof typeof ConnectionTargetType],
              targetId,
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    const items = await Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        targetType: row.targetType,
        targetId: row.targetId,
        createdAt: row.createdAt,
        // Check rápido no portal não precisa hidratar; a lista do painel precisa.
        target: filtered ? null : await resolveSavedTarget(row.targetType, row.targetId),
      })),
    );

    res.json({ items });
  } catch (error) {
    next(error);
  }
});

savedItemsRouter.post('/', validateBody(savedItemBodySchema), async (req, res, next) => {
  try {
    const item = await prisma.savedItem.upsert({
      where: {
        userId_targetType_targetId: {
          userId: req.auth!.sub,
          targetType: req.body.targetType,
          targetId: req.body.targetId,
        },
      },
      create: {
        userId: req.auth!.sub,
        targetType: req.body.targetType,
        targetId: req.body.targetId,
      },
      update: {},
    });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

savedItemsRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.savedItem.findFirst({
      where: { id: param(req.params.id), userId: req.auth!.sub },
    });
    if (!existing) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    await prisma.savedItem.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

followsRouter.get('/', async (req, res, next) => {
  try {
    const items = await prisma.follow.findMany({
      where: { userId: req.auth!.sub },
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

followsRouter.post('/', validateBody(followBodySchema), async (req, res, next) => {
  try {
    const item = await prisma.follow.upsert({
      where: {
        userId_organizationId: {
          userId: req.auth!.sub,
          organizationId: req.body.organizationId,
        },
      },
      create: {
        userId: req.auth!.sub,
        organizationId: req.body.organizationId,
      },
      update: {},
      include: { organization: true },
    });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
});

followsRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.follow.findFirst({
      where: { id: param(req.params.id), userId: req.auth!.sub },
    });
    if (!existing) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    await prisma.follow.delete({ where: { id: existing.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
