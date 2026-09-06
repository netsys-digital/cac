import { Router } from 'express';
import {
  createDomainBodySchema,
  updateDomainBodySchema,
  UserRole,
} from '@cac/shared';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { param } from '../../lib/params.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(UserRole.ADMIN, UserRole.CURADOR));

adminRouter.get('/representation-requests', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : 'REQUESTED';
    const items = await prisma.orgRepresentationRequest.findMany({
      where: status === 'all' ? undefined : { status: status as 'REQUESTED' },
      include: {
        organization: true,
        user: { select: { id: true, email: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/representation-requests/:id/approve', async (req, res, next) => {
  try {
    const existing = await prisma.orgRepresentationRequest.findUnique({
      where: { id: param(req.params.id) },
    });
    if (!existing) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.orgRepresentationRequest.update({
        where: { id: existing.id },
        data: { status: 'APPROVED' },
        include: { organization: true, user: { select: { id: true, email: true, name: true } } },
      });
      await tx.organizationMember.upsert({
        where: {
          userId_organizationId: {
            userId: existing.userId,
            organizationId: existing.organizationId,
          },
        },
        create: {
          userId: existing.userId,
          organizationId: existing.organizationId,
          role: 'ORG_MEMBER',
        },
        update: {},
      });
      return request;
    });

    res.json({ request: result });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/representation-requests/:id/reject', async (req, res, next) => {
  try {
    const request = await prisma.orgRepresentationRequest.update({
      where: { id: param(req.params.id) },
      data: { status: 'REJECTED' },
      include: { organization: true },
    });
    res.json({ request });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/organizations/:id/verify', async (req, res, next) => {
  try {
    const organization = await prisma.organization.update({
      where: { id: param(req.params.id) },
      data: { verificationStatus: 'VERIFIED' },
    });
    res.json({ organization });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/domains', validateBody(createDomainBodySchema), async (req, res, next) => {
  try {
    const domain = await prisma.domain.create({
      data: {
        grouping: req.body.grouping,
        key: req.body.key,
        labelPt: req.body.labelPt,
        labelEn: req.body.labelEn,
        sortOrder: req.body.sortOrder ?? 0,
      },
    });
    res.status(201).json({ domain });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/domains/:id', validateBody(updateDomainBodySchema), async (req, res, next) => {
  try {
    const domain = await prisma.domain.update({
      where: { id: param(req.params.id) },
      data: req.body,
    });
    res.json({ domain });
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/domains/:id', async (req, res, next) => {
  try {
    await prisma.domain.delete({ where: { id: param(req.params.id) } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/** Unified curation queue: technologies, challenges, projects, funding offers IN_REVIEW */
adminRouter.get('/pending', async (_req, res, next) => {
  try {
    const [technologies, challenges, projects, fundingOffers, successCases] = await Promise.all([
      prisma.technology.findMany({
        where: { status: 'IN_REVIEW' },
        include: { organization: true },
        orderBy: { updatedAt: 'asc' },
      }),
      prisma.challenge.findMany({
        where: { status: 'IN_REVIEW' },
        include: { organization: true },
        orderBy: { updatedAt: 'asc' },
      }),
      prisma.project.findMany({
        where: { status: 'IN_REVIEW' },
        include: { organization: true },
        orderBy: { updatedAt: 'asc' },
      }),
      prisma.fundingOffer.findMany({
        where: { status: 'IN_REVIEW' },
        include: { organization: true },
        orderBy: { updatedAt: 'asc' },
      }),
      prisma.successCase.findMany({
        where: { status: 'IN_REVIEW' },
        include: { organization: true },
        orderBy: { updatedAt: 'asc' },
      }),
    ]);
    const items = [
      ...technologies.map((t) => ({
        kind: 'TECHNOLOGY' as const,
        id: t.id,
        title: t.title,
        slug: t.slug,
        organization: t.organization,
        updatedAt: t.updatedAt,
      })),
      ...challenges.map((c) => ({
        kind: 'CHALLENGE' as const,
        id: c.id,
        title: c.title,
        slug: c.slug,
        organization: c.organization,
        updatedAt: c.updatedAt,
      })),
      ...projects.map((p) => ({
        kind: 'PROJECT' as const,
        id: p.id,
        title: p.title,
        slug: p.slug,
        organization: p.organization,
        updatedAt: p.updatedAt,
      })),
      ...fundingOffers.map((f) => ({
        kind: 'FUNDING_OFFER' as const,
        id: f.id,
        title: f.title,
        slug: f.slug,
        organization: f.organization,
        updatedAt: f.updatedAt,
      })),
      ...successCases.map((s) => ({
        kind: 'SUCCESS_CASE' as const,
        id: s.id,
        title: s.title,
        slug: s.slug,
        organization: s.organization,
        updatedAt: s.updatedAt,
      })),
    ].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/pending/:kind/:id/publish', async (req, res, next) => {
  try {
    const kind = param(req.params.kind).toUpperCase();
    const id = param(req.params.id);
    if (kind === 'TECHNOLOGY') {
      const current = await prisma.technology.findUnique({ where: { id } });
      if (!current || current.status !== 'IN_REVIEW') {
        res.status(400).json({ error: 'invalid_status' });
        return;
      }
      const item = await prisma.technology.update({
        where: { id },
        data: { status: 'PUBLISHED' },
      });
      res.json({ item, kind });
      return;
    }
    if (kind === 'CHALLENGE') {
      const current = await prisma.challenge.findUnique({ where: { id } });
      if (!current || current.status !== 'IN_REVIEW') {
        res.status(400).json({ error: 'invalid_status' });
        return;
      }
      const item = await prisma.challenge.update({
        where: { id },
        data: { status: 'PUBLISHED' },
      });
      res.json({ item, kind });
      return;
    }
    if (kind === 'PROJECT') {
      const current = await prisma.project.findUnique({ where: { id } });
      if (!current || current.status !== 'IN_REVIEW') {
        res.status(400).json({ error: 'invalid_status' });
        return;
      }
      const item = await prisma.project.update({
        where: { id },
        data: { status: 'PUBLISHED' },
      });
      res.json({ item, kind });
      return;
    }
    if (kind === 'FUNDING_OFFER') {
      const current = await prisma.fundingOffer.findUnique({ where: { id } });
      if (!current || current.status !== 'IN_REVIEW') {
        res.status(400).json({ error: 'invalid_status' });
        return;
      }
      const item = await prisma.fundingOffer.update({
        where: { id },
        data: { status: 'PUBLISHED' },
      });
      res.json({ item, kind });
      return;
    }
    if (kind === 'SUCCESS_CASE') {
      const current = await prisma.successCase.findUnique({ where: { id } });
      if (!current || current.status !== 'IN_REVIEW') {
        res.status(400).json({ error: 'invalid_status' });
        return;
      }
      const item = await prisma.successCase.update({
        where: { id },
        data: { status: 'PUBLISHED' },
      });
      res.json({ item, kind });
      return;
    }
    res.status(400).json({ error: 'unsupported_kind' });
  } catch (error) {
    next(error);
  }
});

adminRouter.get('/kpis', async (_req, res, next) => {
  try {
    const [
      organizations,
      technologiesPublished,
      challengesPublished,
      projectsPublished,
      connectionsPending,
      connectionsAccepted,
      representationPending,
      funders,
      offers,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.technology.count({ where: { status: 'PUBLISHED' } }),
      prisma.challenge.count({ where: { status: 'PUBLISHED' } }),
      prisma.project.count({ where: { status: 'PUBLISHED' } }),
      prisma.connection.count({ where: { status: 'PENDING' } }),
      prisma.connection.count({ where: { status: 'ACCEPTED' } }),
      prisma.orgRepresentationRequest.count({ where: { status: 'REQUESTED' } }),
      prisma.funderProfile.count({ where: { status: 'PUBLISHED' } }),
      prisma.fundingOffer.count({ where: { status: 'PUBLISHED' } }),
    ]);
    res.json({
      kpis: {
        organizations,
        technologiesPublished,
        challengesPublished,
        projectsPublished,
        connectionsPending,
        connectionsAccepted,
        representationPending,
        funders,
        offers,
      },
    });
  } catch (error) {
    next(error);
  }
});
