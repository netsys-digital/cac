import { env } from '../../config/env.js';

export const BRAND_LOGO_CID = 'brand-logo';

export type MailContent = {
  subject: string;
  text: string;
  html: string;
};

const colors = {
  navy: '#0a2440',
  navy2: '#12364e',
  green: '#13865a',
  green2: '#2cab77',
  green3: '#dff3e9',
  bg: '#f2f6f4',
  ink: '#24353e',
  muted: '#6e7b82',
  line: '#dce5e6',
};

const font = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 16px 0;font-family:${font};font-size:16px;line-height:1.6;color:${colors.ink};">${html}</p>`;
}

export function mutedParagraph(html: string): string {
  return `<p style="margin:0 0 12px 0;font-family:${font};font-size:14px;line-height:1.6;color:${colors.muted};">${html}</p>`;
}

/** Bulletproof CTA button (renders in Outlook via table cell background). */
export function ctaButton(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto;">
  <tr>
    <td align="center" bgcolor="${colors.green}" style="border-radius:10px;">
      <a href="${safeHref}" target="_blank" rel="noopener"
         style="display:inline-block;padding:15px 34px;font-family:${font};font-size:16px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none;border-radius:10px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

export function noticeBox(html: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px 0;">
  <tr>
    <td style="background:${colors.green3};border:1px solid #b9e2cd;border-radius:12px;padding:14px 16px;font-family:${font};font-size:14px;line-height:1.55;color:${colors.navy};">
      ${html}
    </td>
  </tr>
</table>`;
}

export function linkFallback(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  return `<p style="margin:0 0 6px 0;font-family:${font};font-size:13px;line-height:1.5;color:${colors.muted};">${escapeHtml(label)}</p>
<p style="margin:0 0 8px 0;font-family:${font};font-size:13px;line-height:1.5;word-break:break-all;">
  <a href="${safeHref}" target="_blank" rel="noopener" style="color:${colors.green};text-decoration:underline;">${safeHref}</a>
</p>`;
}

/**
 * Shared shell for every transactional e-mail: navy header with the brand logo, white card, footer.
 * The logo is referenced by CID; `sendMail` attaches the file (or swaps to the public URL).
 */
export function wrapEmailHtml(opts: {
  lang: string;
  title: string;
  preheader: string;
  eyebrow?: string;
  heading: string;
  bodyHtml: string;
  footerNote: string;
}): string {
  const brand = escapeHtml(env.brandName);
  const eyebrow = opts.eyebrow
    ? `<p style="margin:0 0 10px 0;font-family:${font};font-size:12px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:${colors.green};">${escapeHtml(opts.eyebrow)}</p>`
    : '';
  return `<!doctype html>
<html lang="${escapeHtml(opts.lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${colors.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(opts.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${colors.bg};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
          <tr>
            <td align="center" bgcolor="${colors.navy}" style="background:${colors.navy};border-radius:18px 18px 0 0;padding:28px 24px;">
              <img src="cid:${BRAND_LOGO_CID}" width="200" alt="${brand}"
                   style="display:block;width:200px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;color:#ffffff;font-family:${font};font-size:20px;font-weight:700;">
            </td>
          </tr>
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background:${colors.green2};">&nbsp;</td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="background:#ffffff;border:1px solid ${colors.line};border-top:0;border-radius:0 0 18px 18px;padding:36px 36px 28px 36px;">
              ${eyebrow}
              <h1 style="margin:0 0 20px 0;font-family:${font};font-size:24px;line-height:1.3;font-weight:700;color:${colors.navy};">${escapeHtml(opts.heading)}</h1>
              ${opts.bodyHtml}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:22px 24px 0 24px;font-family:${font};font-size:12px;line-height:1.6;color:${colors.muted};">
              ${escapeHtml(opts.footerNote)}<br>
              <strong style="color:${colors.navy2};">${brand}</strong> ·
              <a href="${escapeHtml(env.publicWwwUrl)}" target="_blank" rel="noopener" style="color:${colors.green};text-decoration:none;">${escapeHtml(env.publicWwwUrl.replace(/^https?:\/\//, ''))}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
