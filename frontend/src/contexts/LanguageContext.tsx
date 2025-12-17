import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
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

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [isChanging, setIsChanging] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load language from backend (if logged in) or localStorage/browser
  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        // Check if we're on a public page - skip backend call
        const publicPaths = ['/login', '/signup', '/auth/verify-email', '/auth/forgot-password', '/auth/reset-password', '/auth/2fa/verify', '/landing', '/'];
        const isPublicPage = publicPaths.some(path => 
          window.location.pathname === path || window.location.pathname.startsWith(path)
        );

        // Only try to load from backend if not on a public page
        if (!isPublicPage) {
          try {
            const response = await api.get<{ preferredLanguage: string }>('/users/profile');
            const backendLang = response.data.preferredLanguage as LanguageCode;
            
            if (backendLang && LANGUAGES[backendLang]) {
              setCurrentLanguage(backendLang);
              await i18n.changeLanguage(backendLang);
              localStorage.setItem('memorio_ui_language', backendLang);
              setIsInitialized(true);
              return;
            }
          } catch (error) {
            console.log('User not logged in or profile fetch failed, using local settings');
            // Fall through to localStorage/browser detection
          }
        }
        
        // Not logged in OR backend failed - check localStorage
        const savedLang = localStorage.getItem('memorio_ui_language') as LanguageCode;
        
        if (savedLang && LANGUAGES[savedLang]) {
          setCurrentLanguage(savedLang);
          await i18n.changeLanguage(savedLang);
        } else {
          // Fallback to browser language detection
          const detectedLang = i18n.language.split('-')[0] as LanguageCode;
          const lang = LANGUAGES[detectedLang] ? detectedLang : 'en';
          setCurrentLanguage(lang);
          await i18n.changeLanguage(lang);
          localStorage.setItem('memorio_ui_language', lang);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
        // Fallback to English
        setCurrentLanguage('en');
        await i18n.changeLanguage('en');
      } finally {
        setIsInitialized(true);
      }
    };

    loadUserLanguage();
  }, []); // Only run once on mount

  const changeLanguage = async (lang: LanguageCode) => {
    console.log('🌐 changeLanguage called with:', lang);
    if (!LANGUAGES[lang]) {
      console.error(`Language ${lang} is not supported`);
      return;
    }

    setIsChanging(true);
    try {
      // Change UI language in i18next
      await i18n.changeLanguage(lang);
      setCurrentLanguage(lang);
      
      // Save to localStorage
      localStorage.setItem('memorio_ui_language', lang);
      console.log('✅ Saved to localStorage:', lang);
      
      // ALSO save to backend for dataset language (works with cookies or tokens)
      try {
        console.log('📡 Sending PUT request to /users/profile with:', { preferredLanguage: lang });
        await api.put('/users/profile', { preferredLanguage: lang });
        console.log(`✅ Updated backend dataset language to: ${lang}`);
      } catch (error) {
        console.error('❌ Failed to save dataset language to backend:', error);
        console.log('User may not be logged in, language saved locally only');
        // Don't throw - UI language is still changed locally
      }
    } catch (error) {
      console.error('Failed to change language:', error);
      throw error;
    } finally {
      setIsChanging(false);
    }
  };

  // Don't render children until language is initialized
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        isChanging,
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
