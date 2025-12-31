import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { TutorialProvider } from '../contexts/TutorialContext';

// Initialize i18n for tests
i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  resources: {
    en: {
      translation: {
        // Add minimal translations for tests
        'common.loading': 'Loading...',
        'common.error': 'Error',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.confirm': 'Confirm',
        'auth.login': 'Login',
        'auth.logout': 'Logout',
        'auth.signup': 'Sign Up',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'nav.dashboard': 'Dashboard',
        'nav.profile': 'Profile',
        'nav.settings': 'Settings',
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Wrapper component that includes all providers
 */
export const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <LanguageProvider>
          <TutorialProvider>
            <BrowserRouter>{children}</BrowserRouter>
          </TutorialProvider>
        </LanguageProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

/**
 * Wrapper with MemoryRouter for testing specific routes
 */
interface MemoryRouterProvidersProps {
  children: ReactNode;
  initialEntries?: string[];
}

export const MemoryRouterProviders: React.FC<MemoryRouterProvidersProps> = ({
  children,
  initialEntries = ['/'],
}) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <LanguageProvider>
          <TutorialProvider>
            <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
          </TutorialProvider>
        </LanguageProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

/**
 * Minimal providers for unit tests (no router)
 */
export const MinimalProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>{children}</ThemeProvider>
    </I18nextProvider>
  );
};

/**
 * Custom render function with all providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  useMemoryRouter?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
): ReturnType<typeof render> {
  const { initialEntries, useMemoryRouter, ...renderOptions } = options || {};

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    if (useMemoryRouter) {
      return (
        <MemoryRouterProviders initialEntries={initialEntries}>
          {children}
        </MemoryRouterProviders>
      );
    }
    return <AllProviders>{children}</AllProviders>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Render with minimal providers (no router, no language context)
 */
export function renderMinimal(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): ReturnType<typeof render> {
  return render(ui, { wrapper: MinimalProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export i18n instance for test customization
export { i18n };
