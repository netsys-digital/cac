import { randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { enqueueEmail } from '../../lib/queue/email-queue.js';
import { passwordResetMail, type MailLang } from '../../lib/mail/templates/password-reset.js';
import { hashPassword, hashToken } from './auth.service.js';

/** Minimum interval between two reset e-mails for the same account. */
const RESEND_COOLDOWN_MS = 60 * 1000;

function createResetTokenValue(): string {
  return randomBytes(32).toString('hex');
}

function resetExpiresAt(): Date {
  return new Date(Date.now() + env.passwordResetTtlMinutes * 60 * 1000);
}

function buildResetUrl(token: string, lang?: MailLang): string {
  const url = new URL('/reset-password', `${env.publicWebUrl}/`);
  url.searchParams.set('token', token);
  if (lang) url.searchParams.set('lang', lang);
  return url.toString();
}

/**
 * Always resolves the same way whether or not the e-mail exists (no account enumeration).
 * Previous unused tokens are invalidated so only the latest link works.
 */
export async function requestPasswordReset(email: string, lang?: MailLang): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: 'insensitive' } },
  });
  if (!user || user.status === 'DISABLED') return;

  const recent = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
    select: { id: true },
  });
  if (recent) return;

  const token = createResetTokenValue();
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: resetExpiresAt() },
    }),
  ]);

  const mail = passwordResetMail({
    name: user.name,
    resetUrl: buildResetUrl(token, lang),
    ttlMinutes: env.passwordResetTtlMinutes,
    lang,
  });
  await enqueueEmail({
    kind: 'raw',
    payload: { to: user.email, subject: mail.subject, text: mail.text, html: mail.html },
  });
}

async function findActiveToken(token: string) {
  const stored = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, status: true, email: true } } },
  });
  if (!stored || stored.usedAt || stored.expiresAt.getTime() < Date.now()) return null;
  if (stored.user.status === 'DISABLED') return null;
  return stored;
}

export async function isResetTokenValid(token: string): Promise<{ valid: boolean; email?: string }> {
  const stored = await findActiveToken(token);
  if (!stored) return { valid: false };
  const [local, domain] = stored.user.email.split('@');
  const masked = `${local.slice(0, 2)}${'•'.repeat(Math.max(1, local.length - 2))}@${domain}`;
  return { valid: true, email: masked };
}

/** Sets the new password, burns the token and revokes every active session. */
export async function resetPassword(token: string, password: string): Promise<boolean> {
  const stored = await findActiveToken(token);
  if (!stored) return false;

  const passwordHash = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.updateMany({
      where: { userId: stored.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.deleteMany({ where: { userId: stored.userId } }),
  ]);
  return true;
}

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/** Small in-memory fixed-window limiter (per API process) for the public reset endpoints. */
export function hitRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}
