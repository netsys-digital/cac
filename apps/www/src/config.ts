export const brand = {
  name: import.meta.env.VITE_APP_BRAND_NAME ?? 'Climate Action Connect',
  short: import.meta.env.VITE_APP_BRAND_SHORT ?? 'CAC',
  logo: import.meta.env.VITE_APP_BRAND_LOGO ?? '',
};

/** Em vite dev usa proxy same-origin; em build usa VITE_API_URL. */
export const urls = {
  // '' = same-origin /api (gateway portal ou gestor)
  api: import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? 'http://localhost:3003'),
  web: import.meta.env.VITE_WEB_URL ?? 'http://localhost:5178',
  www: import.meta.env.VITE_WWW_URL ?? 'http://localhost:5179',
};
