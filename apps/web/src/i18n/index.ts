import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { pt } from './locales/pt';
import { en } from './locales/en';
import { es } from './locales/es';

const STORAGE_KEY = 'cac.language';
const LEGACY_STORAGE_KEY = 'cac.www.language';

export type AppLanguage = 'pt' | 'en' | 'es';

export const APP_LANGUAGES: AppLanguage[] = ['pt', 'en', 'es'];

export function normalizeLanguage(value: string | null | undefined): AppLanguage {
  if (!value) return 'pt';
  const lower = value.toLowerCase();
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('es')) return 'es';
  return 'pt';
}

/** Ciclo PT → EN → ES → PT (o botão mostra o próximo idioma). */
export function nextLanguage(current: string | null | undefined): AppLanguage {
  const idx = APP_LANGUAGES.indexOf(normalizeLanguage(current));
  return APP_LANGUAGES[(idx + 1) % APP_LANGUAGES.length];
}

function readStoredLanguage(): AppLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return normalizeLanguage(stored);
  } catch {
    return 'pt';
  }
}

function persistLanguage(lng: string) {
  const language = normalizeLanguage(lng);
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // ignore quota / private mode failures
  }
  document.documentElement.lang = language;
}

const initialLanguage = readStoredLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
    es: { translation: es },
  },
  lng: initialLanguage,
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = initialLanguage;

i18n.on('languageChanged', persistLanguage);

export default i18n;
