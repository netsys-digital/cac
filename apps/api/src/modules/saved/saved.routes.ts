import { Router } from 'express';
import { followBodySchema, savedItemBodySchema } from '@cac/shared';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { param } from '../../lib/params.js';

export const savedItemsRouter = Router();
export const followsRouter = Router();

savedItemsRouter.use(requireAuth);
followsRouter.use(requireAuth);

savedItemsRouter.get('/', async (req, res, next) => {
  try {
    const items = await prisma.savedItem.findMany({
      where: { userId: req.auth!.sub },
      orderBy: { createdAt: 'desc' },
    });
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
