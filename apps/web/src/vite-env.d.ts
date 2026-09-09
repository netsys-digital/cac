/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WEB_URL: string;
  readonly VITE_WWW_URL: string;
  readonly VITE_APP_BRAND_NAME: string;
  readonly VITE_APP_BRAND_SHORT: string;
  readonly VITE_APP_BRAND_LOGO: string;
  readonly VITE_FONT_EXTRA_GRANDE: string;
  readonly VITE_FONT_GRANDE: string;
  readonly VITE_FONT_MEDIA: string;
  readonly VITE_FONT_PEQUENA: string;
  readonly VITE_FONT_MINI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
