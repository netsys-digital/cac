import { createHash } from 'node:crypto';
import { Router } from 'express';
import { ContentStatus } from '@cac/shared';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';

export const viewsRouter = Router();

const VIEW_KINDS = ['TECHNOLOGY', 'CHALLENGE', 'FUNDING_OFFER', 'SUCCESS_CASE'] as const;
type ViewKind = (typeof VIEW_KINDS)[number];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse/i;

async function isPublished(kind: ViewKind, id: string): Promise<boolean> {
  const select = { status: true } as const;
  const row =
    kind === 'TECHNOLOGY'
      ? await prisma.technology.findUnique({ where: { id }, select })
      : kind === 'CHALLENGE'
        ? await prisma.challenge.findUnique({ where: { id }, select })
        : kind === 'FUNDING_OFFER'
          ? await prisma.fundingOffer.findUnique({ where: { id }, select })
          : await prisma.successCase.findUnique({ where: { id }, select });
  return row?.status === ContentStatus.PUBLISHED;
}

/** Registra a visualização de uma publicação no portal (anônimo; deduplicado por visitante/dia). */
viewsRouter.post('/', async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as { targetType?: unknown; targetId?: unknown; visitorId?: unknown };
    const targetType = String(body.targetType ?? '').toUpperCase();
    const targetId = String(body.targetId ?? '');
    if (!(VIEW_KINDS as readonly string[]).includes(targetType) || !UUID_RE.test(targetId)) {
      res.status(400).json({ error: 'invalid_target' });
      return;
    }

    const userAgent = req.get('user-agent') ?? '';
    if (!userAgent || BOT_RE.test(userAgent)) {
      res.status(204).end();
      return;
    }

    const kind = targetType as ViewKind;
    if (!(await isPublished(kind, targetId))) {
      res.status(404).json({ error: 'not_found' });
      return;
    }

    const visitorId =
      typeof body.visitorId === 'string' && UUID_RE.test(body.visitorId)
        ? body.visitorId
        : `${req.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || ''}|${userAgent}`;
    const visitorHash = createHash('sha256').update(`${env.jwtSecret}:${visitorId}`).digest('hex');
    const day = new Date(new Date().toISOString().slice(0, 10));

    await prisma.contentView.createMany({
      data: [{ targetType: kind, targetId, visitorHash, day }],
      skipDuplicates: true,
    });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
