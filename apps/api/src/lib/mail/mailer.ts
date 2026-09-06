import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (env.smtpHost) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
    });
  } else {
    // Dev fallback: log-only transport
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

export async function sendMail(payload: MailPayload): Promise<void> {
  const info = await getTransporter().sendMail({
    from: env.smtpFrom,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html ?? `<pre>${payload.text}</pre>`,
  });
  if (!env.smtpHost) {
    console.log('[mail:dev]', JSON.stringify({ to: payload.to, subject: payload.subject, info }));
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
        text: `Olá,\n\nSua solicitação sobre "${ctx.targetLabel}" foi recusada por ${ctx.targetOrg}.\n`,
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
