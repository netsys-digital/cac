import { env } from '../../../config/env.js';
import {
  ctaButton,
  escapeHtml,
  linkFallback,
  mutedParagraph,
  noticeBox,
  paragraph,
  wrapEmailHtml,
  type MailContent,
} from '../layout.js';

export type MailLang = 'pt' | 'en' | 'es';

type Copy = {
  subject: (brand: string) => string;
  preheader: string;
  eyebrow: string;
  heading: (name: string) => string;
  intro: (brand: string) => string;
  instruction: string;
  cta: string;
  validity: (duration: string) => string;
  ignore: string;
  security: string;
  fallback: string;
  footer: string;
  signature: (brand: string) => string;
  duration: (minutes: number) => string;
};

function durationLabel(minutes: number, hour: [string, string], minute: [string, string]) {
  if (minutes % 60 === 0) {
    const h = minutes / 60;
    return `${h} ${h === 1 ? hour[0] : hour[1]}`;
  }
  return `${minutes} ${minutes === 1 ? minute[0] : minute[1]}`;
}

const copy: Record<MailLang, Copy> = {
  pt: {
    subject: (brand) => `Redefinição de senha · ${brand}`,
    preheader: 'Use o link seguro para criar uma nova senha de acesso.',
    eyebrow: 'Segurança da conta',
    heading: (name) => `Olá, ${name}!`,
    intro: (brand) =>
      `Recebemos um pedido para redefinir a senha da sua conta no <strong>${brand}</strong>.`,
    instruction: 'Para criar uma nova senha, clique no botão abaixo:',
    cta: 'Criar nova senha',
    validity: (d) =>
      `<strong>O link é válido por ${d}</strong> e pode ser usado apenas uma vez. Depois disso, basta solicitar um novo na tela de acesso.`,
    ignore:
      'Se você não fez esse pedido, pode ignorar este e-mail com tranquilidade — sua senha atual continua valendo e nenhuma alteração foi feita.',
    security:
      'Por segurança, ao definir a nova senha encerramos as sessões abertas em outros dispositivos. Nunca compartilhe este link.',
    fallback: 'Se o botão não funcionar, copie e cole este endereço no navegador:',
    footer: 'Você recebeu esta mensagem porque houve uma solicitação de redefinição de senha para este e-mail.',
    signature: (brand) => `Equipe ${brand}`,
    duration: (m) => durationLabel(m, ['hora', 'horas'], ['minuto', 'minutos']),
  },
  en: {
    subject: (brand) => `Password reset · ${brand}`,
    preheader: 'Use the secure link to create a new password.',
    eyebrow: 'Account security',
    heading: (name) => `Hi, ${name}!`,
    intro: (brand) => `We received a request to reset the password for your <strong>${brand}</strong> account.`,
    instruction: 'To create a new password, click the button below:',
    cta: 'Create new password',
    validity: (d) =>
      `<strong>This link is valid for ${d}</strong> and can be used only once. After that, just request a new one from the sign-in page.`,
    ignore:
      "If you didn't request this, you can safely ignore this e-mail — your current password remains unchanged.",
    security:
      'For your security, setting a new password signs you out of other devices. Never share this link.',
    fallback: "If the button doesn't work, copy and paste this address into your browser:",
    footer: 'You received this message because a password reset was requested for this e-mail address.',
    signature: (brand) => `The ${brand} team`,
    duration: (m) => durationLabel(m, ['hour', 'hours'], ['minute', 'minutes']),
  },
  es: {
    subject: (brand) => `Restablecimiento de contraseña · ${brand}`,
    preheader: 'Usa el enlace seguro para crear una nueva contraseña.',
    eyebrow: 'Seguridad de la cuenta',
    heading: (name) => `¡Hola, ${name}!`,
    intro: (brand) =>
      `Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>${brand}</strong>.`,
    instruction: 'Para crear una nueva contraseña, haz clic en el botón:',
    cta: 'Crear nueva contraseña',
    validity: (d) =>
      `<strong>El enlace es válido por ${d}</strong> y solo puede usarse una vez. Después, puedes solicitar uno nuevo en la pantalla de acceso.`,
    ignore:
      'Si no hiciste esta solicitud, puedes ignorar este correo con tranquilidad: tu contraseña actual sigue vigente.',
    security:
      'Por seguridad, al definir la nueva contraseña cerramos las sesiones abiertas en otros dispositivos. Nunca compartas este enlace.',
    fallback: 'Si el botón no funciona, copia y pega esta dirección en tu navegador:',
    footer: 'Recibiste este mensaje porque se solicitó restablecer la contraseña de este correo.',
    signature: (brand) => `Equipo ${brand}`,
    duration: (m) => durationLabel(m, ['hora', 'horas'], ['minuto', 'minutos']),
  },
};

export function passwordResetMail(opts: {
  name: string;
  resetUrl: string;
  ttlMinutes: number;
  lang?: MailLang;
}): MailContent {
  const lang: MailLang = opts.lang && opts.lang in copy ? opts.lang : 'pt';
  const c = copy[lang];
  const brand = env.brandName;
  const firstName = opts.name.trim().split(/\s+/)[0] || opts.name;
  const duration = c.duration(opts.ttlMinutes);
  const stripTags = (value: string) => value.replace(/<[^>]+>/g, '');

  const text = [
    stripTags(c.heading(firstName)),
    '',
    stripTags(c.intro(brand)),
    c.instruction,
    '',
    opts.resetUrl,
    '',
    stripTags(c.validity(duration)),
    '',
    c.ignore,
    c.security,
    '',
    c.signature(brand),
  ].join('\n');

  const html = wrapEmailHtml({
    lang,
    title: c.subject(brand),
    preheader: c.preheader,
    eyebrow: c.eyebrow,
    heading: c.heading(firstName),
    bodyHtml: [
      paragraph(c.intro(escapeHtml(brand))),
      paragraph(c.instruction),
      ctaButton(c.cta, opts.resetUrl),
      noticeBox(c.validity(escapeHtml(duration))),
      paragraph(c.ignore),
      mutedParagraph(c.security),
      `<hr style="border:0;border-top:1px solid #dce5e6;margin:24px 0 18px 0;">`,
      linkFallback(c.fallback, opts.resetUrl),
      `<p style="margin:22px 0 0 0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#0a2440;font-weight:700;">${escapeHtml(c.signature(brand))}</p>`,
    ].join('\n'),
    footerNote: c.footer,
  });

  return { subject: c.subject(brand), text, html };
}
