import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { pt } from './locales/pt';
import { en } from './locales/en';

const STORAGE_KEY = 'cac.language';
const LEGACY_STORAGE_KEY = 'cac.www.language';

export function normalizeLanguage(value: string | null | undefined): 'pt' | 'en' {
  if (!value) return 'pt';
  return value.toLowerCase().startsWith('en') ? 'en' : 'pt';
}

function readStoredLanguage(): 'pt' | 'en' {
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
  },
  lng: initialLanguage,
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
});

document.documentElement.lang = initialLanguage;

i18n.on('languageChanged', persistLanguage);

export default i18n;
