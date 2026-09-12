import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { assertCanActForOrganization } from '../../lib/org-access.js';
import { prisma } from '../../lib/prisma.js';
import { requireAuth } from '../../middleware/auth.js';
import { param } from '../../lib/params.js';

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

const mediaAllowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const coverAllowed = new Set(['image/jpeg', 'image/png', 'image/webp']);

const uploadMedia = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!mediaAllowed.has(file.mimetype)) {
      cb(new Error('invalid_mime'));
      return;
    }
    cb(null, true);
  },
});

const uploadCover = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!coverAllowed.has(file.mimetype)) {
      cb(new Error('invalid_mime'));
      return;
    }
    cb(null, true);
  },
});

const uploadBanner = multer({
  storage,
  limits: { fileSize: 300 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!coverAllowed.has(file.mimetype)) {
      cb(new Error('invalid_mime'));
      return;
    }
    cb(null, true);
  },
});

export const mediaRouter = Router();

function withUpload(
  uploader: ReturnType<typeof multer>,
): (req: Parameters<typeof requireAuth>[0], res: Parameters<typeof requireAuth>[1], next: Parameters<typeof requireAuth>[2]) => void {
  return (req, res, next) => {
    uploader.single('file')(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ error: 'invalid_upload', detail: String(err) });
        return;
      }
      next();
    });
  };
}

mediaRouter.post(
  '/technologies/:id/media',
  requireAuth,
  withUpload(uploadMedia),
  async (req, res, next) => {
    try {
      const technology = await prisma.technology.findUnique({ where: { id: param(req.params.id) } });
      if (!technology) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, technology.organizationId, req.auth!.role);
      if (!req.file) {
        res.status(400).json({ error: 'file_required' });
        return;
      }

      const kind = req.file.mimetype === 'application/pdf' ? 'PDF' : 'IMAGE';
      const url = `/uploads/${req.file.filename}`;
      const media = await prisma.technologyMedia.create({
        data: {
          technologyId: technology.id,
          url,
          kind,
          filename: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
      });
      if (kind === 'IMAGE' && !technology.coverImageUrl) {
        await prisma.technology.update({
          where: { id: technology.id },
          data: { coverImageUrl: url },
        });
      }
      res.status(201).json({ media });
    } catch (error) {
      next(error);
    }
  },
);

type CoverKind = 'technologies' | 'challenges' | 'projects' | 'funding-offers' | 'success-cases';

async function loadCoverTarget(kind: CoverKind, id: string) {
  switch (kind) {
    case 'technologies':
      return prisma.technology.findUnique({ where: { id } });
    case 'challenges':
      return prisma.challenge.findUnique({ where: { id } });
    case 'projects':
      return prisma.project.findUnique({ where: { id } });
    case 'funding-offers':
      return prisma.fundingOffer.findUnique({ where: { id } });
    case 'success-cases':
      return prisma.successCase.findUnique({ where: { id } });
  }
}

async function saveCoverUrl(kind: CoverKind, id: string, coverImageUrl: string) {
  switch (kind) {
    case 'technologies':
      return prisma.technology.update({ where: { id }, data: { coverImageUrl } });
    case 'challenges':
      return prisma.challenge.update({ where: { id }, data: { coverImageUrl } });
    case 'projects':
      return prisma.project.update({ where: { id }, data: { coverImageUrl } });
    case 'funding-offers':
      return prisma.fundingOffer.update({ where: { id }, data: { coverImageUrl } });
    case 'success-cases':
      return prisma.successCase.update({ where: { id }, data: { coverImageUrl } });
  }
}

function registerCoverRoute(kind: CoverKind) {
  mediaRouter.post(`/${kind}/:id/cover`, requireAuth, withUpload(uploadCover), async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const item = await loadCoverTarget(kind, id);
      if (!item) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, item.organizationId, req.auth!.role);
      if (!req.file) {
        res.status(400).json({ error: 'file_required' });
        return;
      }

      const coverImageUrl = `/uploads/${req.file.filename}`;
      const updated = await saveCoverUrl(kind, id, coverImageUrl);

      if (kind === 'technologies') {
        await prisma.technologyMedia.create({
          data: {
            technologyId: id,
            url: coverImageUrl,
            kind: 'IMAGE',
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
          },
        });
      }
      if (kind === 'success-cases') {
        await prisma.successCaseMedia.create({
          data: {
            successCaseId: id,
            url: coverImageUrl,
            kind: 'IMAGE',
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            caption: 'cover',
          },
        });
      }

      res.status(201).json({ coverImageUrl, item: updated });
    } catch (error) {
      next(error);
    }
  });
}

registerCoverRoute('technologies');
registerCoverRoute('challenges');
registerCoverRoute('projects');
registerCoverRoute('funding-offers');
registerCoverRoute('success-cases');

async function saveBannerUrl(kind: CoverKind, id: string, bannerImageUrl: string) {
  switch (kind) {
    case 'technologies':
      return prisma.technology.update({ where: { id }, data: { bannerImageUrl } });
    case 'challenges':
      return prisma.challenge.update({ where: { id }, data: { bannerImageUrl } });
    case 'funding-offers':
      return prisma.fundingOffer.update({ where: { id }, data: { bannerImageUrl } });
    case 'success-cases':
      return prisma.successCase.update({ where: { id }, data: { bannerImageUrl } });
    case 'projects':
      // Projects do not support promotional banners yet.
      return null;
  }
}

function registerBannerRoute(kind: Exclude<CoverKind, 'projects'>) {
  mediaRouter.post(`/${kind}/:id/banner`, requireAuth, withUpload(uploadBanner), async (req, res, next) => {
    try {
      const id = param(req.params.id);
      const item = await loadCoverTarget(kind, id);
      if (!item) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, item.organizationId, req.auth!.role);
      if (!req.file) {
        res.status(400).json({ error: 'file_required' });
        return;
      }

      const bannerImageUrl = `/uploads/${req.file.filename}`;
      const updated = await saveBannerUrl(kind, id, bannerImageUrl);
      res.status(201).json({ bannerImageUrl, item: updated });
    } catch (error) {
      next(error);
    }
  });
}

registerBannerRoute('technologies');
registerBannerRoute('challenges');
registerBannerRoute('funding-offers');
registerBannerRoute('success-cases');
