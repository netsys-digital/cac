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

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      cb(new Error('invalid_mime'));
      return;
    }
    cb(null, true);
  },
});

export const mediaRouter = Router();

mediaRouter.post(
  '/technologies/:id/media',
  requireAuth,
  (req, res, next) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ error: 'invalid_upload', detail: String(err) });
        return;
      }
      next();
    });
  },
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
      res.status(201).json({ media });
    } catch (error) {
      next(error);
    }
  },
);
