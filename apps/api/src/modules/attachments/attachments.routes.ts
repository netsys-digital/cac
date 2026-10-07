import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router, type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { ContentStatus } from '@cac/shared';
import { env } from '../../config/env.js';
import { canActForOrganization, assertCanActForOrganization } from '../../lib/org-access.js';
import { prisma } from '../../lib/prisma.js';
import { param } from '../../lib/params.js';
import { enqueueTranslationIfPublished } from '../../lib/queue/translation-queue.js';
import { ATTACHMENT_OWNER_TRANSLATION, localizeEntities, requestLang } from '../../lib/translation/index.js';
import { requireAuth, type AuthPayload } from '../../middleware/auth.js';

export const attachmentsRouter = Router();

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
fs.mkdirSync(uploadDir, { recursive: true });

export const ATTACHMENT_LIMITS = {
  GALLERY: { max: 20, maxBytes: 8 * 1024 * 1024 },
  DOCUMENT: { max: 10, maxBytes: 20 * 1024 * 1024 },
} as const;

const GALLERY_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.odt',
  '.ods',
  '.odp',
  '.rtf',
  '.txt',
  '.csv',
]);

type AttachmentKind = keyof typeof ATTACHMENT_LIMITS;
type Kind = 'technologies' | 'challenges' | 'funding-offers' | 'success-cases';

const ENTITY_TYPE: Record<Kind, string> = {
  technologies: 'TECHNOLOGY',
  challenges: 'CHALLENGE',
  'funding-offers': 'FUNDING_OFFER',
  'success-cases': 'SUCCESS_CASE',
};

export const ATTACHMENT_TITLE_MAX = 200;
export const ATTACHMENT_DESCRIPTION_MAX = 500;

/** Título/descrição opcionais: vazio vira `null`, excedente é cortado no limite. */
function parseMeta(body: unknown): { title: string | null; description: string | null } {
  const source = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const text = (key: string, max: number) => {
    const value = typeof source[key] === 'string' ? (source[key] as string).trim() : '';
    return value ? value.slice(0, max) : null;
  };
  return {
    title: text('title', ATTACHMENT_TITLE_MAX),
    description: text('description', ATTACHMENT_DESCRIPTION_MAX),
  };
}

function parseKind(raw: unknown): AttachmentKind | null {
  return raw === 'GALLERY' || raw === 'DOCUMENT' ? raw : null;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: ATTACHMENT_LIMITS.DOCUMENT.maxBytes },
  fileFilter: (req, file, cb) => {
    const kind = parseKind(req.query.kind);
    const ext = path.extname(file.originalname).toLowerCase();
    const ok =
      kind === 'GALLERY'
        ? GALLERY_MIMES.has(file.mimetype)
        : kind === 'DOCUMENT'
          ? DOCUMENT_EXTENSIONS.has(ext)
          : false;
    if (!ok) {
      cb(new Error('invalid_mime'));
      return;
    }
    cb(null, true);
  },
});

async function loadTarget(kind: Kind, id: string) {
  switch (kind) {
    case 'technologies':
      return prisma.technology.findUnique({ where: { id }, select: { id: true, organizationId: true, status: true } });
    case 'challenges':
      return prisma.challenge.findUnique({ where: { id }, select: { id: true, organizationId: true, status: true } });
    case 'funding-offers':
      return prisma.fundingOffer.findUnique({ where: { id }, select: { id: true, organizationId: true, status: true } });
    case 'success-cases':
      return prisma.successCase.findUnique({ where: { id }, select: { id: true, organizationId: true, status: true } });
  }
}

function optionalAuth(req: Request): AuthPayload | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice('Bearer '.length), env.jwtSecret) as AuthPayload;
  } catch {
    return null;
  }
}

function removeFile(url: string) {
  if (!url.startsWith('/uploads/')) return;
  const file = path.join(uploadDir, path.basename(url));
  fs.promises.unlink(file).catch(() => undefined);
}

function registerAttachmentRoutes(kind: Kind) {
  const entityType = ENTITY_TYPE[kind];

  attachmentsRouter.get(`/${kind}/:id/attachments`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const target = await loadTarget(kind, param(req.params.id));
      if (!target) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      if (target.status !== ContentStatus.PUBLISHED) {
        const auth = optionalAuth(req);
        if (!auth || !(await canActForOrganization(auth.sub, target.organizationId, auth.role))) {
          res.status(404).json({ error: 'not_found' });
          return;
        }
      }
      const rows = await prisma.publicationAttachment.findMany({
        where: { entityType, entityId: target.id },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      const [localized] = await localizeEntities(
        ATTACHMENT_OWNER_TRANSLATION[entityType],
        [{ id: target.id, attachments: rows }],
        requestLang(req.query),
      );
      const items = localized.attachments;
      res.json({
        gallery: items.filter((item) => item.kind === 'GALLERY'),
        documents: items.filter((item) => item.kind === 'DOCUMENT'),
        limits: ATTACHMENT_LIMITS,
      });
    } catch (error) {
      next(error);
    }
  });

  attachmentsRouter.post(
    `/${kind}/:id/attachments`,
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
      const file = req.file;
      try {
        const attachmentKind = parseKind(req.query.kind);
        const target = await loadTarget(kind, param(req.params.id));
        if (!attachmentKind || !target || !file) {
          if (file) removeFile(`/uploads/${file.filename}`);
          res.status(!target ? 404 : 400).json({ error: !target ? 'not_found' : 'file_required' });
          return;
        }
        await assertCanActForOrganization(req.auth!.sub, target.organizationId, req.auth!.role);

        const limit = ATTACHMENT_LIMITS[attachmentKind];
        if (file.size > limit.maxBytes) {
          removeFile(`/uploads/${file.filename}`);
          res.status(400).json({ error: 'file_too_large' });
          return;
        }
        const count = await prisma.publicationAttachment.count({
          where: { entityType, entityId: target.id, kind: attachmentKind },
        });
        if (count >= limit.max) {
          removeFile(`/uploads/${file.filename}`);
          res.status(400).json({ error: 'attachment_limit_reached', max: limit.max });
          return;
        }

        const attachment = await prisma.publicationAttachment.create({
          data: {
            entityType,
            entityId: target.id,
            kind: attachmentKind,
            url: `/uploads/${file.filename}`,
            filename: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            sortOrder: count,
            ...parseMeta(req.body),
          },
        });
        await queueOwnerTranslation(target.status, target.id);
        res.status(201).json({ attachment });
      } catch (error) {
        if (file) removeFile(`/uploads/${file.filename}`);
        next(error);
      }
    },
  );

  attachmentsRouter.delete(`/${kind}/:id/attachments/:attachmentId`, requireAuth, async (req, res, next) => {
    try {
      const target = await loadTarget(kind, param(req.params.id));
      if (!target) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, target.organizationId, req.auth!.role);
      const attachment = await prisma.publicationAttachment.findFirst({
        where: { id: param(req.params.attachmentId), entityType, entityId: target.id },
      });
      if (!attachment) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await prisma.$transaction([
        prisma.publicationAttachment.delete({ where: { id: attachment.id } }),
        prisma.contentTranslation.deleteMany({
          where: { entityId: target.id, field: { startsWith: `attachment.${attachment.id}.` } },
        }),
      ]);
      removeFile(attachment.url);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  attachmentsRouter.patch(`/${kind}/:id/attachments/:attachmentId`, requireAuth, async (req, res, next) => {
    try {
      const target = await loadTarget(kind, param(req.params.id));
      if (!target) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, target.organizationId, req.auth!.role);
      const attachment = await prisma.publicationAttachment.findFirst({
        where: { id: param(req.params.attachmentId), entityType, entityId: target.id },
      });
      if (!attachment) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      const updated = await prisma.publicationAttachment.update({
        where: { id: attachment.id },
        data: parseMeta(req.body),
      });
      await queueOwnerTranslation(target.status, target.id);
      res.json({ attachment: updated });
    } catch (error) {
      next(error);
    }
  });

  async function queueOwnerTranslation(status: string, ownerId: string) {
    await enqueueTranslationIfPublished(status, {
      entityType: ATTACHMENT_OWNER_TRANSLATION[entityType],
      entityId: ownerId,
    }).catch(() => undefined);
  }
}

registerAttachmentRoutes('technologies');
registerAttachmentRoutes('challenges');
registerAttachmentRoutes('funding-offers');
registerAttachmentRoutes('success-cases');
