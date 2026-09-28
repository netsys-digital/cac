import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../../config/env.js';
import { BRAND_LOGO_CID } from './layout.js';

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../../');
const DEFAULT_LOGO_PATH = path.join(repoRoot, 'apps/web/public/images/brand/LogoAgrizone.png');

let transporter: Transporter | null | undefined;

function isSmtpConfigured(): boolean {
  return Boolean(env.smtpHost && env.smtpFrom);
}

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  if (!isSmtpConfigured()) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    connectionTimeout: env.smtpTimeoutMs,
    greetingTimeout: env.smtpTimeoutMs,
    socketTimeout: env.smtpTimeoutMs,
  });
  return transporter;
}

function fromHeader(): string {
  const name = env.smtpFromName.trim().replace(/"/g, '');
  return name ? `"${name}" <${env.smtpFrom}>` : env.smtpFrom;
}

let logoPathCache: string | null | undefined;

function resolveLogoPath(): string | null {
  if (logoPathCache !== undefined) return logoPathCache;
  const candidate = env.mailLogoPath ? path.resolve(repoRoot, env.mailLogoPath) : DEFAULT_LOGO_PATH;
  logoPathCache = fs.existsSync(candidate) ? candidate : null;
  if (!logoPathCache) console.warn(`[mail] logo não encontrado em ${candidate}; usando URL pública`);
  return logoPathCache;
}

/** Public URL fallback when the logo file is not available to the process. */
export function publicLogoUrl(): string {
  return env.mailLogoUrl || `${env.publicWebUrl}/images/brand/LogoAgrizone.png`;
}

/**
 * Templates reference the logo as `cid:<BRAND_LOGO_CID>`. We attach the file inline so it renders
 * without remote-image blocking; if the file is missing, the reference is rewritten to the public URL.
 */
function withBrandLogo(html: string | undefined) {
  if (!html || !html.includes(`cid:${BRAND_LOGO_CID}`)) return { html, attachments: undefined };
  const logoPath = resolveLogoPath();
  if (!logoPath) {
    return { html: html.split(`cid:${BRAND_LOGO_CID}`).join(publicLogoUrl()), attachments: undefined };
  }
  return {
    html,
    attachments: [{ filename: path.basename(logoPath), path: logoPath, cid: BRAND_LOGO_CID }],
  };
}

/** Envia via SMTP quando configurado; caso contrário registra no log (stub). */
export async function sendMail(payload: MailPayload): Promise<void> {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[mail-stub] to=${payload.to} subject="${payload.subject}"`);
    if (env.nodeEnv !== 'production') console.log(`[mail-stub] body:\n${payload.text}`);
    return;
  }

  const { html, attachments } = withBrandLogo(payload.html);
  try {
    const info = await transport.sendMail({
      from: fromHeader(),
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: html ?? undefined,
      attachments,
    });
    console.log(`[mail] sent to=${payload.to} messageId=${info.messageId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[mail] failed to=${payload.to} subject="${payload.subject}": ${message}`);
    throw error;
  }
}

export function connectionMailTemplates(kind: string, ctx: Record<string, string>) {
  const brand = env.brandName;
  switch (kind) {
    case 'request':
      return {
        subject: `[${brand}] Nova solicitação de conexão`,
        text: `Olá,\n\n${ctx.requesterName} (${ctx.requesterOrg}) solicitou conexão sobre "${ctx.targetLabel}" com objetivo ${ctx.objective}.\n\nMensagem: ${ctx.message || '(sem mensagem)'}\n\nAcesse o painel para aceitar ou recusar.\n`,
      };
    case 'accepted':
      return {
        subject: `[${brand}] Conexão aceita`,
        text: `Olá,\n\nSua solicitação sobre "${ctx.targetLabel}" foi aceita por ${ctx.targetOrg}.\nContato: ${ctx.contactEmail}\n`,
      };
    case 'declined':
      return {
        subject: `[${brand}] Conexão recusada`,
        text: `Olá,\n\nSua solicitação sobre "${ctx.targetLabel}" foi recusada por ${ctx.targetOrg}.\n\nJustificativa: ${ctx.reason || '(não informada)'}\n`,
      };
    case 'reminder':
      return {
        subject: `[${brand}] Lembrete: conexão pendente`,
        text: `Olá,\n\nHá uma solicitação pendente sobre "${ctx.targetLabel}" de ${ctx.requesterOrg}. Expira em ${ctx.expiresAt}.\n`,
      };
    case 'expired':
      return {
        subject: `[${brand}] Conexão expirada`,
        text: `Olá,\n\nA solicitação sobre "${ctx.targetLabel}" expirou sem resposta.\n`,
      };
    default:
      return { subject: `[${brand}] Notificação`, text: ctx.message || '' };
  }
}
