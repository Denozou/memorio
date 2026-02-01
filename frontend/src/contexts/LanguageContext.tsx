import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useUserProfile, useUpdateProfile } from '../hooks/useQueries';
import { queryKeys } from '../lib/queryClient';
import { LANGUAGES } from '../i18n/config';
import type { LanguageCode } from '../i18n/config';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  changeLanguage: (lang: LanguageCode) => Promise<void>;
  isChanging: boolean;
  availableLanguages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Check if current page is public (doesn't require auth)
function isPublicPage(): boolean {
  const pathname = window.location.pathname;

  // Exact match paths
  const exactMatchPaths = ['/', '/login', '/signup', '/landing', '/contact'];
  if (exactMatchPaths.includes(pathname)) {
    return true;
  }

  // Prefix match paths (for nested routes like /auth/verify-email/token)
  const prefixPaths = ['/auth/verify-email', '/auth/forgot-password', '/auth/reset-password', '/auth/2fa/verify'];
  return prefixPaths.some(path => pathname.startsWith(path));
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Only fetch profile on protected pages - React Query handles caching
  const { data: profile, isLoading: profileLoading } = useUserProfile({
    enabled: !isPublicPage(),
  });

  const updateProfileMutation = useUpdateProfile();

  // Initialize language from profile, localStorage, or browser
  useEffect(() => {
    const initLanguage = async () => {
      // If we have profile data with preferred language, use it
      if (profile?.preferredLanguage && LANGUAGES[profile.preferredLanguage as LanguageCode]) {
        const lang = profile.preferredLanguage as LanguageCode;
        setCurrentLanguage(lang);
        await i18n.changeLanguage(lang);
        localStorage.setItem('memorio_ui_language', lang);
        setIsInitialized(true);
        return;
      }

      // If still loading profile on a protected page, wait
      if (!isPublicPage() && profileLoading) {
        return;
      }

      // Fallback to localStorage
      const savedLang = localStorage.getItem('memorio_ui_language') as LanguageCode;
      if (savedLang && LANGUAGES[savedLang]) {
        setCurrentLanguage(savedLang);
        await i18n.changeLanguage(savedLang);
        setIsInitialized(true);
        return;
      }

      // Fallback to browser language detection
      const detectedLang = i18n.language.split('-')[0] as LanguageCode;
      const lang = LANGUAGES[detectedLang] ? detectedLang : 'en';
      setCurrentLanguage(lang);
      await i18n.changeLanguage(lang);
      localStorage.setItem('memorio_ui_language', lang);
      setIsInitialized(true);
    };

    initLanguage();
  }, [profile, profileLoading, i18n]);

  const changeLanguage = useCallback(async (lang: LanguageCode) => {
    if (!LANGUAGES[lang]) {
      console.error(`Language ${lang} is not supported`);
      return;
    }

    // Change UI language in i18next
    await i18n.changeLanguage(lang);
    setCurrentLanguage(lang);

    // Save to localStorage
    localStorage.setItem('memorio_ui_language', lang);

    // Update backend if user is logged in (on protected page)
    if (!isPublicPage()) {
      try {
        await updateProfileMutation.mutateAsync({ preferredLanguage: lang });
        // Invalidate and refetch all language-dependent queries
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() }),
          // Invalidate all learning queries (articles are language-filtered on backend)
          queryClient.invalidateQueries({ queryKey: queryKeys.learning.all }),
        ]);
        // Force refetch of learning articles immediately
        await queryClient.refetchQueries({ queryKey: queryKeys.learning.articles() });
      } catch (error) {
        console.error('Failed to update language preference on server:', error);
        // Still works locally, but log the actual error for debugging
      }
    }
  }, [i18n, updateProfileMutation, queryClient]);

  // Don't render children until language is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        isChanging: updateProfileMutation.isPending,
        availableLanguages: LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
