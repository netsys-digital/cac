import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import {
  approveRepresentationBodySchema,
  createDomainBodySchema,
  updateDomainBodySchema,
  updateOrganizationAdminBodySchema,
  UserRole,
} from '@cac/shared';
import { prisma } from '../../lib/prisma.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { param } from '../../lib/params.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(UserRole.ADMIN, UserRole.CURADOR));

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const logoAllowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.bin';
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!logoAllowed.has(file.mimetype)) {
      cb(new Error('invalid_mime'));
      return;
    }
    cb(null, true);
  },
});

function withOrgLogoUpload(
  req: Parameters<typeof requireAuth>[0],
  res: Parameters<typeof requireAuth>[1],
  next: Parameters<typeof requireAuth>[2],
) {
  logoUpload.single('logo')(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: 'invalid_upload', detail: String(err) });
      return;
    }
    next();
  });
}

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

adminRouter.post(
  '/representation-requests/:id/approve',
  validateBody(approveRepresentationBodySchema),
  async (req, res, next) => {
    try {
      const existing = await prisma.orgRepresentationRequest.findUnique({
        where: { id: param(req.params.id) },
      });
      if (!existing) {
        res.status(404).json({ error: 'not_found' });
        return;
      }

      const publishKinds = [...new Set(req.body.publishKinds as string[])] as Array<
        'TECHNOLOGY' | 'CHALLENGE' | 'FUNDING_OFFER' | 'SUCCESS_CASE'
      >;

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
        await tx.organization.update({
          where: { id: existing.organizationId },
          data: {
            publishKinds,
            verificationStatus: 'VERIFIED',
          },
        });
        return request;
      });

      res.json({ request: result });
    } catch (error) {
      next(error);
    }
  },
);

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

adminRouter.get('/organizations', async (_req, res, next) => {
  try {
    const items = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            members: true,
            technologies: true,
            challenges: true,
            fundingOffers: true,
            successCases: true,
          },
        },
      },
    });
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch(
  '/organizations/:id',
  validateBody(updateOrganizationAdminBodySchema),
  async (req, res, next) => {
    try {
      const data: {
        name?: string;
        summary?: string | null;
        country?: string | null;
        region?: string | null;
        website?: string | null;
        publishKinds?: Array<'TECHNOLOGY' | 'CHALLENGE' | 'FUNDING_OFFER' | 'SUCCESS_CASE'>;
        verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
      } = {};
      if (req.body.name !== undefined) data.name = req.body.name;
      if (req.body.summary !== undefined) data.summary = req.body.summary;
      if (req.body.country !== undefined) data.country = req.body.country;
      if (req.body.region !== undefined) data.region = req.body.region;
      if (req.body.website !== undefined) {
        data.website = req.body.website === '' ? null : req.body.website;
      }
      if (req.body.publishKinds !== undefined) {
        data.publishKinds = [...new Set(req.body.publishKinds as string[])] as Array<
          'TECHNOLOGY' | 'CHALLENGE' | 'FUNDING_OFFER' | 'SUCCESS_CASE'
        >;
      }
      if (req.body.verificationStatus !== undefined) {
        data.verificationStatus = req.body.verificationStatus;
      }
      const organization = await prisma.organization.update({
        where: { id: param(req.params.id) },
        data,
      });
      res.json({ organization });
    } catch (error) {
      next(error);
    }
  },
);

adminRouter.post('/organizations/:id/logo', withOrgLogoUpload, async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'logo_required' });
      return;
    }
    const organization = await prisma.organization.update({
      where: { id: param(req.params.id) },
      data: { logoUrl: `/uploads/${req.file.filename}` },
    });
    res.json({ organization });
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
        summary: t.summary,
        country: t.country,
        region: t.region,
        status: t.status,
        curationNote: t.curationNote,
        organization: t.organization,
        updatedAt: t.updatedAt,
      })),
      ...challenges.map((c) => ({
        kind: 'CHALLENGE' as const,
        id: c.id,
        title: c.title,
        slug: c.slug,
        summary: c.summary,
        country: c.country,
        region: c.region,
        status: c.status,
        curationNote: c.curationNote,
        organization: c.organization,
        updatedAt: c.updatedAt,
      })),
      ...projects.map((p) => ({
        kind: 'PROJECT' as const,
        id: p.id,
        title: p.title,
        slug: p.slug,
        summary: p.summary,
        country: p.country,
        region: p.region,
        status: p.status,
        curationNote: p.curationNote,
        organization: p.organization,
        updatedAt: p.updatedAt,
      })),
      ...fundingOffers.map((f) => ({
        kind: 'FUNDING_OFFER' as const,
        id: f.id,
        title: f.title,
        slug: f.slug,
        summary: f.summary,
        country: f.country,
        region: f.region,
        status: f.status,
        curationNote: f.curationNote,
        organization: f.organization,
        updatedAt: f.updatedAt,
      })),
      ...successCases.map((s) => ({
        kind: 'SUCCESS_CASE' as const,
        id: s.id,
        title: s.title,
        slug: s.slug,
        summary: s.summary,
        country: s.country,
        region: s.region,
        status: s.status,
        curationNote: s.curationNote,
        organization: s.organization,
        updatedAt: s.updatedAt,
      })),
    ].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

type CurationDecision = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

function readCurationNote(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const note = (body as { note?: unknown }).note;
  return typeof note === 'string' ? note.trim() : '';
}

async function applyCurationDecision(
  kind: string,
  id: string,
  nextStatus: CurationDecision,
  note: string | null,
) {
  const data = {
    status: nextStatus,
    curationNote: note,
    reviewedAt: new Date(),
  };
  if (kind === 'TECHNOLOGY') {
    const current = await prisma.technology.findUnique({ where: { id } });
    if (!current || current.status !== 'IN_REVIEW') return { error: 'invalid_status' as const };
    const item = await prisma.technology.update({ where: { id }, data });
    return { item, kind };
  }
  if (kind === 'CHALLENGE') {
    const current = await prisma.challenge.findUnique({ where: { id } });
    if (!current || current.status !== 'IN_REVIEW') return { error: 'invalid_status' as const };
    const item = await prisma.challenge.update({ where: { id }, data });
    return { item, kind };
  }
  if (kind === 'PROJECT') {
    const current = await prisma.project.findUnique({ where: { id } });
    if (!current || current.status !== 'IN_REVIEW') return { error: 'invalid_status' as const };
    const item = await prisma.project.update({ where: { id }, data });
    return { item, kind };
  }
  if (kind === 'FUNDING_OFFER') {
    const current = await prisma.fundingOffer.findUnique({ where: { id } });
    if (!current || current.status !== 'IN_REVIEW') return { error: 'invalid_status' as const };
    const item = await prisma.fundingOffer.update({ where: { id }, data });
    return { item, kind };
  }
  if (kind === 'SUCCESS_CASE') {
    const current = await prisma.successCase.findUnique({ where: { id } });
    if (!current || current.status !== 'IN_REVIEW') return { error: 'invalid_status' as const };
    const item = await prisma.successCase.update({ where: { id }, data });
    return { item, kind };
  }
  return { error: 'unsupported_kind' as const };
}

/** Approve for portal publication (optional conclusion note). */
adminRouter.post('/pending/:kind/:id/publish', async (req, res, next) => {
  try {
    const kind = param(req.params.kind).toUpperCase();
    const id = param(req.params.id);
    const note = readCurationNote(req.body);
    const result = await applyCurationDecision(kind, id, 'PUBLISHED', note || null);
    if ('error' in result) {
      res.status(result.error === 'unsupported_kind' ? 400 : 400).json({ error: result.error });
      return;
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/** Return to author for adjustments (required note). */
adminRouter.post('/pending/:kind/:id/return', async (req, res, next) => {
  try {
    const kind = param(req.params.kind).toUpperCase();
    const id = param(req.params.id);
    const note = readCurationNote(req.body);
    if (!note) {
      res.status(400).json({ error: 'note_required' });
      return;
    }
    const result = await applyCurationDecision(kind, id, 'DRAFT', note);
    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/** Reject publication (required note → ARCHIVED). */
adminRouter.post('/pending/:kind/:id/reject', async (req, res, next) => {
  try {
    const kind = param(req.params.kind).toUpperCase();
    const id = param(req.params.id);
    const note = readCurationNote(req.body);
    if (!note) {
      res.status(400).json({ error: 'note_required' });
      return;
    }
    const result = await applyCurationDecision(kind, id, 'ARCHIVED', note);
    if ('error' in result) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json(result);
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
