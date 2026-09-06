import { redis } from '../redis.js';
import { connectionMailTemplates, sendMail, type MailPayload } from '../mail/mailer.js';

export const EMAIL_QUEUE = 'email:send';

export type EmailJob =
  | { kind: 'raw'; payload: MailPayload }
  | { kind: 'connection'; template: string; to: string; ctx: Record<string, string> };

export async function enqueueEmail(job: EmailJob): Promise<void> {
  try {
    if (redis.status !== 'ready') await redis.connect();
    await redis.rpush(EMAIL_QUEUE, JSON.stringify(job));
  } catch (error) {
    console.warn('[queue] enqueueEmail failed — sending inline', error);
    await processEmailJob(job);
  }
}

export async function dequeueEmail(timeoutSec = 5): Promise<EmailJob | null> {
  if (redis.status !== 'ready') await redis.connect();
  const result = await redis.blpop(EMAIL_QUEUE, timeoutSec);
  if (!result) return null;
  try {
    return JSON.parse(result[1]) as EmailJob;
  } catch {
    return null;
  }
}

export async function processEmailJob(job: EmailJob): Promise<void> {
  if (job.kind === 'raw') {
    await sendMail(job.payload);
    return;
  }
  const tpl = connectionMailTemplates(job.template, job.ctx);
  await sendMail({ to: job.to, subject: tpl.subject, text: tpl.text });
}
