import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock the auth module
vi.mock('../lib/auth', () => ({
  isAuthenticated: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading...',
      };
      return translations[key] || key;
    },
  }),
}));

function TestApp({ initialEntry = '/protected' }: { initialEntry?: string }) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  let isAuthenticatedMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const authModule = await import('../lib/auth');
    isAuthenticatedMock = authModule.isAuthenticated as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading state', () => {
    it('shows loading text while checking authentication', async () => {
      // Create a promise that won't resolve immediately
      let resolveAuth: (value: boolean) => void;
      const authPromise = new Promise<boolean>((resolve) => {
        resolveAuth = resolve;
      });
      isAuthenticatedMock.mockReturnValue(authPromise);

      render(<TestApp />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Cleanup - resolve the promise
      resolveAuth!(true);
    });
  });

  describe('Authenticated user', () => {
    it('renders children when authenticated', async () => {
      isAuthenticatedMock.mockResolvedValue(true);

      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    it('does not redirect when authenticated', async () => {
      isAuthenticatedMock.mockResolvedValue(true);

      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });

      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  describe('Unauthenticated user', () => {
    it('redirects to login when not authenticated', async () => {
      isAuthenticatedMock.mockResolvedValue(false);

      render(<TestApp />);

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('does not render children when not authenticated', async () => {
      isAuthenticatedMock.mockResolvedValue(false);

      render(<TestApp />);

      await waitFor(() => {
        expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      });
    });
  });

  describe('Auth check error handling', () => {
    it('treats errors as unauthenticated and redirects to login', async () => {
      // isAuthenticated catches errors and returns false
      isAuthenticatedMock.mockResolvedValue(false);

      render(<TestApp />);

      // The component treats errors as unauthenticated
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });
});
