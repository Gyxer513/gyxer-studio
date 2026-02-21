import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type Locale, type Translations } from './translations';

interface I18nStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useI18nStore = create<I18nStore>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'gyxer-locale' },
  ),
);

/**
 * Hook to get a translation function for the current locale.
 */
export function useTranslation() {
  const locale = useI18nStore((s) => s.locale);

  function t(key: keyof Translations): string {
    return translations[locale][key] ?? key;
  }

  return { t, locale };
}

export { type Locale } from './translations';
