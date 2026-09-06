import { Router } from 'express';
import {
  ContentStatus,
  createSuccessCaseBodySchema,
  updateSuccessCaseBodySchema,
  UserRole,
} from '@cac/shared';
import { assertCanActForOrganization } from '../../lib/org-access.js';
import { prisma } from '../../lib/prisma.js';
import { slugify } from '../../lib/slug.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { isUuid, param } from '../../lib/params.js';

export const successCasesRouter = Router();

function mapCase(item: {
  needs?: Array<{ needType: string; detail: string | null; id: string }>;
  media?: unknown[];
  [key: string]: unknown;
}) {
  return {
    ...item,
    needs: item.needs ?? [],
    media: item.media ?? [],
  };
}

successCasesRouter.get('/', async (_req, res, next) => {
  try {
    const items = await prisma.successCase.findMany({
      where: { status: ContentStatus.PUBLISHED },
      include: { organization: true, needs: true, media: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json({ items: items.map(mapCase) });
  } catch (error) {
    next(error);
  }
});

successCasesRouter.get('/:slugOrId', async (req, res, next) => {
  try {
    const key = param(req.params.slugOrId);
    const item = await prisma.successCase.findFirst({
      where: {
        ...(isUuid(key) ? { OR: [{ slug: key }, { id: key }] } : { slug: key }),
        status: ContentStatus.PUBLISHED,
      },
      include: { organization: true, needs: true, media: true },
    });
    if (!item) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.json({ successCase: mapCase(item) });
  } catch (error) {
    next(error);
  }
});

successCasesRouter.post('/', requireAuth, validateBody(createSuccessCaseBodySchema), async (req, res, next) => {
  try {
    await assertCanActForOrganization(req.auth!.sub, req.body.organizationId, req.auth!.role);
    const slug = req.body.slug || slugify(req.body.title);
    const successCase = await prisma.successCase.create({
      data: {
        title: req.body.title,
        slug,
        summary: req.body.summary,
        context: req.body.context,
        outcomes: req.body.outcomes,
        country: req.body.country,
        region: req.body.region,
        organizationId: req.body.organizationId,
        status: ContentStatus.DRAFT,
        needs: req.body.needs?.length
          ? {
              create: req.body.needs.map((n: { needType: string; detail?: string }) => ({
                needType: n.needType as never,
                detail: n.detail,
              })),
            }
          : undefined,
        media: req.body.evidenceNotes?.length
          ? {
              create: req.body.evidenceNotes.map((note: string, idx: number) => ({
                url: `evidence://note/${idx + 1}`,
                kind: 'PDF' as const,
                filename: `evidencia-${idx + 1}.txt`,
                mimeType: 'text/plain',
                size: note.length,
                caption: note,
              })),
            }
          : undefined,
      },
      include: { needs: true, media: true, organization: true },
    });
    res.status(201).json({ successCase: mapCase(successCase) });
  } catch (error) {
    next(error);
  }
});

successCasesRouter.patch(
  '/:id',
  requireAuth,
  validateBody(updateSuccessCaseBodySchema),
  async (req, res, next) => {
    try {
      const current = await prisma.successCase.findUnique({ where: { id: param(req.params.id) } });
      if (!current) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
      const { needs, evidenceNotes, ...rest } = req.body as {
        needs?: Array<{ needType: string; detail?: string }>;
        evidenceNotes?: string[];
        [k: string]: unknown;
      };
      const successCase = await prisma.successCase.update({
        where: { id: current.id },
        data: {
          ...rest,
          ...(needs
            ? {
                needs: {
                  deleteMany: {},
                  create: needs.map((n) => ({
                    needType: n.needType as never,
                    detail: n.detail,
                  })),
                },
              }
            : {}),
          ...(evidenceNotes
            ? {
                media: {
                  deleteMany: {},
                  create: evidenceNotes.map((note, idx) => ({
                    url: `evidence://note/${idx + 1}`,
                    kind: 'PDF' as const,
                    filename: `evidencia-${idx + 1}.txt`,
                    mimeType: 'text/plain',
                    size: note.length,
                    caption: note,
                  })),
                },
              }
            : {}),
        },
        include: { needs: true, media: true, organization: true },
      });
      res.json({ successCase: mapCase(successCase) });
    } catch (error) {
      next(error);
    }
  },
);

successCasesRouter.post('/:id/submit', requireAuth, async (req, res, next) => {
  try {
    const current = await prisma.successCase.findUnique({ where: { id: param(req.params.id) } });
    if (!current) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    await assertCanActForOrganization(req.auth!.sub, current.organizationId, req.auth!.role);
    if (current.status !== ContentStatus.DRAFT) {
      res.status(400).json({ error: 'invalid_status' });
      return;
    }
    const successCase = await prisma.successCase.update({
      where: { id: current.id },
      data: { status: ContentStatus.IN_REVIEW },
      include: { needs: true, media: true },
    });
    res.json({ successCase: mapCase(successCase) });
  } catch (error) {
    next(error);
  }
});

successCasesRouter.post(
  '/:id/publish',
  requireAuth,
  requireRole(UserRole.ADMIN, UserRole.CURADOR),
  async (req, res, next) => {
    try {
      const current = await prisma.successCase.findUnique({ where: { id: param(req.params.id) } });
      if (!current || current.status !== ContentStatus.IN_REVIEW) {
        res.status(400).json({ error: 'invalid_status' });
        return;
      }
      const successCase = await prisma.successCase.update({
        where: { id: current.id },
        data: { status: ContentStatus.PUBLISHED },
        include: { needs: true, media: true },
      });
      res.json({ successCase: mapCase(successCase) });
    } catch (error) {
      next(error);
    }
  },
);
