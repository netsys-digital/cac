import { Router } from 'express';
import { ContentStatus, createProjectBodySchema, updateProjectBodySchema, UserRole } from '@cac/shared';
import { assertCanActForOrganization } from '../../lib/org-access.js';
import { prisma } from '../../lib/prisma.js';
import { slugify } from '../../lib/slug.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { isUuid, param } from '../../lib/params.js';
import { enqueueEmbedding } from '../../lib/queue/embedding-queue.js';

export const projectsRouter = Router();

projectsRouter.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.project.findMany({
      where: { status: ContentStatus.PUBLISHED },
      include: { organization: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

projectsRouter.get('/:slugOrId', async (req, res, next) => {
  try {
    const key = param(req.params.slugOrId);
    const item = await prisma.project.findFirst({
      where: {
        ...(isUuid(key) ? { OR: [{slug: key}, {id: key}] } : {slug: key}),
        status: ContentStatus.PUBLISHED,
      },
      include: { organization: true },
    });
    if (!item) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({ project: item });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post('/', requireAuth, validateBody(createProjectBodySchema), async (req, res, next) => {
  try {
    await assertCanActForOrganization(req.auth!.sub, req.body.organizationId, req.auth!.role);
    if (req.body.status === ContentStatus.PUBLISHED) {
      res.status(400).json({ error: 'workflow_required' });
      return;
    }
    const slug = req.body.slug || slugify(req.body.title);
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: 'slug_taken' });
      return;
    }
    const project = await prisma.project.create({
      data: {
        title: req.body.title,
        slug,
        type: req.body.type,
        summary: req.body.summary,
        organizationId: req.body.organizationId,
        country: req.body.country,
        region: req.body.region,
        status: req.body.status ?? ContentStatus.DRAFT,
      },
    });
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

projectsRouter.patch(
  '/:id',
  requireAuth,
  validateBody(updateProjectBodySchema),
  async (req, res, next) => {
    try {
      const current = await prisma.project.findUnique({ where: { id: param(req.params.id) } });
      if (!current) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
      if (req.body.status === ContentStatus.PUBLISHED) {
        res.status(400).json({ error: 'workflow_required' });
        return;
      }
      const project = await prisma.project.update({
        where: { id: current.id },
        data: req.body,
      });
      res.json({ project });
    } catch (error) {
      next(error);
    }
  },
);

projectsRouter.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const current = await prisma.project.findUnique({ where: { id: param(req.params.id) } });
    if (!current) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
    if (current.status !== ContentStatus.DRAFT) {
      res.status(400).json({ error: 'invalid_status' });
      return;
    }
    const project = await prisma.project.update({
      where: { id: current.id },
      data: { status: ContentStatus.IN_REVIEW },
    });
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

projectsRouter.post(
  '/:id/publish',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.CURADOR),
  async (req, res, next) => {
    try {
      const current = await prisma.project.findUnique({ where: { id: param(req.params.id) } });
      if (!current || current.status !== ContentStatus.IN_REVIEW) {
        res.status(400).json({ error: 'invalid_status' });
        return;
      }
      const project = await prisma.project.update({
        where: { id: current.id },
        data: { status: ContentStatus.PUBLISHED },
      });
      void enqueueEmbedding({ entityType: 'project', entityId: project.id });
      res.json({ project });
    } catch (error) {
      next(error);
    }
  },
);
