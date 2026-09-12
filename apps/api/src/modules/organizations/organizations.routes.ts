import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import {
  addMemberBodySchema,
  createOrganizationBodySchema,
  createRepresentationBodySchema,
  updateOrganizationBodySchema,
} from '@cac/shared';
import { ZodError } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { slugify } from '../../lib/slug.js';
import { requireAuth } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { isUuid, param } from '../../lib/params.js';
import { enqueueTranslation, localizeEntities, localizeOne, requestLang } from '../../lib/translation/index.js';

export const organizationsRouter = Router();

function respondZod(res: Parameters<typeof requireAuth>[1], error: ZodError) {
  res.status(400).json({
    error: 'validation_error',
    details: error.flatten(),
  });
}

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const proofAllowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const logoAllowed = new Set(['image/jpeg', 'image/png', 'image/webp']);

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `${randomUUID()}${ext}`);
  },
});

const proofUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!proofAllowed.has(file.mimetype)) {
      cb(new Error('invalid_mime'));
      return;
    }
    cb(null, true);
  },
});

const logoUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!logoAllowed.has(file.mimetype)) {
      cb(new Error('invalid_mime'));
      return;
    }
    cb(null, true);
  },
});

function withProofUpload(
  req: Parameters<typeof requireAuth>[0],
  res: Parameters<typeof requireAuth>[1],
  next: Parameters<typeof requireAuth>[2],
) {
  proofUpload.fields([
    { name: 'proofDocument1', maxCount: 1 },
    { name: 'proofDocument2', maxCount: 1 },
  ])(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: 'invalid_upload', detail: String(err) });
      return;
    }
    next();
  });
}

function withLogoUpload(
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

organizationsRouter.get('/', async (req, res, next) => {
  try {
    const items = await prisma.organization.findMany({
      orderBy: { name: 'asc' },
      take: 100,
    });
    res.json({ items: await localizeEntities('organization', items, requestLang(req.query)) });
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
    res.json({ organization: await localizeOne('organization', item, requestLang(req.query)) });
  } catch (error) {
    next(error);
  }
});

organizationsRouter.post('/', requireAuth, withLogoUpload, async (req, res, next) => {
  try {
    const body = createOrganizationBodySchema.parse(req.body);
    if (!req.file) {
      res.status(400).json({ error: 'logo_required' });
      return;
    }
    const baseSlug = body.slug || slugify(body.name);
    const existing = await prisma.organization.findUnique({ where: { slug: baseSlug } });
    if (existing) {
      res.status(409).json({ error: 'slug_taken' });
      return;
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    const organization = await prisma.organization.create({
      data: {
        name: body.name,
        slug: baseSlug,
        summary: body.summary,
        country: body.country,
        region: body.region,
        website: body.website || null,
        logoUrl,
        members: {
          create: {
            userId: req.auth!.sub,
            role: 'ORG_ADMIN',
          },
        },
      },
    });
    void enqueueTranslation({ entityType: 'organization', entityId: organization.id });
    res.status(201).json({ organization });
  } catch (error) {
    if (error instanceof ZodError) {
      respondZod(res, error);
      return;
    }
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
      void enqueueTranslation({ entityType: 'organization', entityId: organization.id });
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
  withProofUpload,
  async (req, res, next) => {
    try {
      const body = createRepresentationBodySchema.parse(req.body);
      const organization = await prisma.organization.findUnique({ where: { id: param(req.params.id) } });
      if (!organization) {
        res.status(404).json({ error: 'not_found' });
        return;
      }

      const files = req.files as
        | Record<string, Array<{ filename: string }> | undefined>
        | undefined;
      const file1 = files?.proofDocument1?.[0];
      const file2 = files?.proofDocument2?.[0];

      const existing = await prisma.orgRepresentationRequest.findUnique({
        where: {
          userId_organizationId: {
            userId: req.auth!.sub,
            organizationId: param(req.params.id),
          },
        },
      });

      const proofDocument1Url = file1
        ? `/uploads/${file1.filename}`
        : existing?.proofDocument1Url || '';
      if (!proofDocument1Url) {
        res.status(400).json({ error: 'proof_document_required' });
        return;
      }
      const proofDocument2Url = file2
        ? `/uploads/${file2.filename}`
        : (existing?.proofDocument2Url ?? null);

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
          proofDocument1Url,
          proofDocument2Url,
          status: 'REQUESTED',
        },
        update: {
          unit: body.unit,
          linkRole: body.linkRole,
          interest: body.interest,
          proofDocument1Url,
          proofDocument2Url,
          status: 'REQUESTED',
        },
        include: { organization: true },
      });
      res.status(201).json({ request });
    } catch (error) {
      if (error instanceof ZodError) {
        respondZod(res, error);
        return;
      }
      next(error);
    }
  },
);
