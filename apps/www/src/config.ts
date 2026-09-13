export const brand = {
  name: import.meta.env.VITE_APP_BRAND_NAME ?? 'AgriZONE Connect',
  short: import.meta.env.VITE_APP_BRAND_SHORT ?? 'AZC',
  logo: import.meta.env.VITE_APP_BRAND_LOGO ?? '',
};

/**
 * Base da API.
 * Em Vite local: absoluta para compartilhar o cookie de refresh com o painel.
 * Em build com nginx (prod): VITE_API_URL vazio → same-origin `/api`.
 */
export const urls = {
  api: import.meta.env.VITE_API_URL?.trim() || (import.meta.env.DEV ? 'http://localhost:3003' : ''),
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
