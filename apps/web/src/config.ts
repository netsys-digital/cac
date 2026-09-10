import { FONT_SCALE_DEFAULTS } from '@cac/ui';

export const brand = {
  name: import.meta.env.VITE_APP_BRAND_NAME ?? 'Climate Action Connect',
  short: import.meta.env.VITE_APP_BRAND_SHORT ?? 'CAC',
  logo: import.meta.env.VITE_APP_BRAND_LOGO ?? '',
};

/**
 * Em `vite dev`, chama a API pela mesma origem (proxy em vite.config).
 * Assim o cookie httpOnly de refresh fica first-party e sobrevive ao F5.
 * Em build/produção usa VITE_API_URL absoluto.
 */
export const urls = {
  api: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? 'http://localhost:3003'),
  web: import.meta.env.VITE_WEB_URL ?? 'http://localhost:5178',
  www: import.meta.env.VITE_WWW_URL ?? 'http://localhost:5179',
};

const sharedFont = {
  extraGrande: import.meta.env.VITE_FONT_EXTRA_GRANDE?.trim() || FONT_SCALE_DEFAULTS.extraGrande,
  grande: import.meta.env.VITE_FONT_GRANDE?.trim() || FONT_SCALE_DEFAULTS.grande,
  media: import.meta.env.VITE_FONT_MEDIA?.trim() || FONT_SCALE_DEFAULTS.media,
  pequena: import.meta.env.VITE_FONT_PEQUENA?.trim() || FONT_SCALE_DEFAULTS.pequena,
  mini: import.meta.env.VITE_FONT_MINI?.trim() || FONT_SCALE_DEFAULTS.mini,
};

/** Painel: um nível abaixo da escala compartilhada (ex.: grande → média). */
export const fontEnv = {
  VITE_FONT_EXTRA_GRANDE: sharedFont.grande,
  VITE_FONT_GRANDE: sharedFont.media,
  VITE_FONT_MEDIA: sharedFont.pequena,
  VITE_FONT_PEQUENA: sharedFont.mini,
  VITE_FONT_MINI: sharedFont.mini,
};
