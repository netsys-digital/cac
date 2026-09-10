/** Escala tipográfica única (www + web). Valores vêm de VITE_FONT_* no .env. */

export type FontScale = {
  extraGrande: string;
  grande: string;
  media: string;
  pequena: string;
  mini: string;
};

export const FONT_SCALE_DEFAULTS: FontScale = {
  extraGrande: '54px',
  grande: '32px',
  media: '18px',
  pequena: '14px',
  mini: '13px',
};

export type FontScaleEnv = {
  VITE_FONT_EXTRA_GRANDE?: string;
  VITE_FONT_GRANDE?: string;
  VITE_FONT_MEDIA?: string;
  VITE_FONT_PEQUENA?: string;
  VITE_FONT_MINI?: string;
};

/** Aplica --cac-font-* no :root (antes do primeiro paint preferível). */
export function applyFontScale(env: FontScaleEnv = {}): FontScale {
  const scale: FontScale = {
    extraGrande: env.VITE_FONT_EXTRA_GRANDE?.trim() || FONT_SCALE_DEFAULTS.extraGrande,
    grande: env.VITE_FONT_GRANDE?.trim() || FONT_SCALE_DEFAULTS.grande,
    media: env.VITE_FONT_MEDIA?.trim() || FONT_SCALE_DEFAULTS.media,
    pequena: env.VITE_FONT_PEQUENA?.trim() || FONT_SCALE_DEFAULTS.pequena,
    mini: env.VITE_FONT_MINI?.trim() || FONT_SCALE_DEFAULTS.mini,
  };
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--cac-font-extra-grande', scale.extraGrande);
    root.style.setProperty('--cac-font-grande', scale.grande);
    root.style.setProperty('--cac-font-media', scale.media);
    root.style.setProperty('--cac-font-pequena', scale.pequena);
    root.style.setProperty('--cac-font-mini', scale.mini);
  }
  return scale;
}
