import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { ContentStatus, createFunderProfileBodySchema, updateFunderProfileBodySchema } from '@cac/shared';
import { prisma } from '../../lib/prisma.js';
import { slugify } from '../../lib/slug.js';
import { param } from '../../lib/params.js';
import { validateBody } from '../../middleware/validate.js';
import { enqueueTranslationIfPublished } from '../../lib/translation/index.js';

export const adminFundersRouter = Router();

const include = { organization: { select: { id: true, name: true, slug: true } } } as const;

function isSlugTaken(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

adminFundersRouter.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.funderProfile.findMany({
      include,
      orderBy: { name: 'asc' },
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

adminFundersRouter.post('/', validateBody(createFunderProfileBodySchema), async (req, res, next) => {
  try {
    const organizationId = req.body.organizationId || null;
    const status = req.body.status ?? ContentStatus.PUBLISHED;
    const funder = await prisma.funderProfile.create({
      data: {
        name: req.body.name,
        slug: req.body.slug || slugify(req.body.name),
        summary: req.body.summary,
        website: String(req.body.website).trim(),
        interestAreas: req.body.interestAreas,
        contactName: String(req.body.contactName).trim(),
        contactEmail: String(req.body.contactEmail).trim().toLowerCase(),
        country: req.body.country,
        region: req.body.region,
        organizationId,
        status,
      },
      include,
    });
    void enqueueTranslationIfPublished(funder.status, { entityType: 'funder', entityId: funder.id });
    res.status(201).json({ funder });
  } catch (error) {
    if (isSlugTaken(error)) {
      res.status(409).json({ error: 'slug_taken' });
      return;
    }
    next(error);
  }
});

adminFundersRouter.patch('/:id', validateBody(updateFunderProfileBodySchema), async (req, res, next) => {
  try {
    const id = param(req.params.id);
    const current = await prisma.funderProfile.findUnique({ where: { id } });
    if (!current) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    const funder = await prisma.funderProfile.update({
      where: { id },
      data: {
        ...(req.body.name != null ? { name: req.body.name } : {}),
        ...(req.body.slug ? { slug: req.body.slug } : {}),
        ...(req.body.summary != null ? { summary: req.body.summary } : {}),
        ...(req.body.website !== undefined
          ? { website: req.body.website ? String(req.body.website).trim() || null : null }
          : {}),
        ...(req.body.interestAreas != null ? { interestAreas: req.body.interestAreas } : {}),
        ...(req.body.contactName != null ? { contactName: String(req.body.contactName).trim() } : {}),
        ...(req.body.contactEmail != null ? { contactEmail: String(req.body.contactEmail).trim().toLowerCase() } : {}),
        ...(req.body.country != null ? { country: req.body.country } : {}),
        ...(req.body.region != null ? { region: req.body.region } : {}),
        ...(req.body.status != null ? { status: req.body.status } : {}),
        ...(req.body.organizationId !== undefined ? { organizationId: req.body.organizationId || null } : {}),
      },
      include,
    });
    void enqueueTranslationIfPublished(funder.status, { entityType: 'funder', entityId: funder.id });
    res.json({ funder });
  } catch (error) {
    if (isSlugTaken(error)) {
      res.status(409).json({ error: 'slug_taken' });
      return;
    }
    next(error);
  }
});

adminFundersRouter.delete('/:id', async (req, res, next) => {
  try {
    const id = param(req.params.id);
    const current = await prisma.funderProfile.findUnique({ where: { id }, select: { id: true } });
    if (!current) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    await prisma.$transaction([
      prisma.contentTranslation.deleteMany({ where: { entityType: 'funder', entityId: id } }),
      prisma.savedItem.deleteMany({ where: { targetType: 'FUNDER', targetId: id } }),
      prisma.contentView.deleteMany({ where: { targetType: 'FUNDER', targetId: id } }),
      prisma.funderProfile.delete({ where: { id } }),
    ]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
