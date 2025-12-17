import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import pl from '../locales/pl.json';

// Define available languages
export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  pl: { code: 'pl', name: 'Polish', nativeName: 'Polski' }
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Initialize i18next
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: {
      en: { translation: en },
      pl: { translation: pl }
    },
    fallbackLng: 'en',
    debug: false, // Set to true for development debugging
    
    interpolation: {
      escapeValue: false // React already escapes values
    },

    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'memorio_ui_language'
    }
  });

export default i18n;
