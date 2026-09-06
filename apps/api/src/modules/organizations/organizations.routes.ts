import { Router } from 'express';
import {
  addMemberBodySchema,
  createOrganizationBodySchema,
  updateOrganizationBodySchema,
} from '@cac/shared';
import { prisma } from '../../lib/prisma.js';
import { slugify } from '../../lib/slug.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { isUuid, param } from '../../lib/params.js';

export const organizationsRouter = Router();

organizationsRouter.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
      take: 100,
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

organizationsRouter.get('/:slugOrId', async (req, res, next) => {
  try {
    const key = param(req.params.slugOrId);
    const item = await prisma.organization.findFirst({
      where: {
        ...(isUuid(key) ? { OR: [{ slug: key }, { id: key }] } : { slug: key }),
      },
      include: {
        members: { take: 20 },
      },
    });
    if (!item) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({ organization: item });
  } catch (error) {
    next(error);
  }
});

organizationsRouter.post('/', requireAuth, validateBody(createOrganizationBodySchema), async (req, res, next) => {
  try {
    const body = req.body as {
      name: string;
      slug?: string;
      summary?: string;
      country?: string;
      region?: string;
      website?: string;
    };
    const baseSlug = body.slug || slugify(body.name);
    const existing = await prisma.organization.findUnique({ where: { slug: baseSlug } });
    if (existing) {
      res.status(409).json({ error: 'slug_taken' });
      return;
    }

    const organization = await prisma.organization.create({
      data: {
        name: body.name,
        slug: baseSlug,
        summary: body.summary,
        country: body.country,
        region: body.region,
        website: body.website || null,
        members: {
          create: {
            userId: req.auth!.sub,
            role: 'ORG_ADMIN',
          },
        },
      },
    });
    res.status(201).json({ organization });
  } catch (error) {
    next(error);
  }
});

organizationsRouter.patch(
  '/:id',
  requireAuth,
  validateBody(updateOrganizationBodySchema),
  async (req, res, next) => {
    try {
      const organization = await prisma.organization.update({
        where: { id: param(req.params.id) },
        data: {
          ...req.body,
          website: req.body.website === '' ? null : req.body.website,
        },
      });
      res.json({ organization });
    } catch (error) {
      next(error);
    }
  },
);

organizationsRouter.post(
  '/:id/members',
  requireAuth,
  validateBody(addMemberBodySchema),
  async (req, res, next) => {
    try {
      const member = await prisma.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: req.body.userId,
            organizationId: param(req.params.id),
          },
        },
        create: {
          userId: req.body.userId,
          organizationId: param(req.params.id),
          role: req.body.role,
        },
        update: { role: req.body.role },
      });
      res.status(201).json({ member });
    } catch (error) {
      next(error);
    }
  },
);

organizationsRouter.post(
  '/:id/representation-requests',
  requireAuth,
  async (req, res, next) => {
    try {
      const { createRepresentationBodySchema } = await import('@cac/shared');
      const body = createRepresentationBodySchema.parse(req.body);
      const organization = await prisma.organization.findUnique({ where: { id: param(req.params.id) } });
      if (!organization) {
        res.status(404).json({ error: 'not_found' });
        return;
      }

      const request = await prisma.orgRepresentationRequest.upsert({
        where: {
          userId_organizationId: {
            userId: req.auth!.sub,
            organizationId: param(req.params.id),
          },
        },
        create: {
          userId: req.auth!.sub,
          organizationId: param(req.params.id),
          unit: body.unit,
          linkRole: body.linkRole,
          interest: body.interest,
          status: 'REQUESTED',
        },
        update: {
          unit: body.unit,
          linkRole: body.linkRole,
          interest: body.interest,
          status: 'REQUESTED',
        },
        include: { organization: true },
      });
      res.status(201).json({ request });
    } catch (error) {
      next(error);
    }
  },
);
