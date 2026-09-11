export const brand = {
  name: import.meta.env.VITE_APP_BRAND_NAME ?? 'AgriZone Connect',
  short: import.meta.env.VITE_APP_BRAND_SHORT ?? 'AZC',
  logo: import.meta.env.VITE_APP_BRAND_LOGO ?? '',
};

/** Em vite dev usa proxy same-origin; em build usa VITE_API_URL. */
export const urls = {
  // '' = same-origin /api (gateway portal ou gestor)
  api: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? 'http://localhost:3003'),
  web: import.meta.env.VITE_WEB_URL ?? 'http://localhost:5178',
  www: import.meta.env.VITE_WWW_URL ?? 'http://localhost:5179',
};

export const fontEnv = {
  VITE_FONT_EXTRA_GRANDE: import.meta.env.VITE_FONT_EXTRA_GRANDE,
  VITE_FONT_GRANDE: import.meta.env.VITE_FONT_GRANDE,
  VITE_FONT_MEDIA: import.meta.env.VITE_FONT_MEDIA,
  VITE_FONT_PEQUENA: import.meta.env.VITE_FONT_PEQUENA,
  VITE_FONT_MINI: import.meta.env.VITE_FONT_MINI,
};
