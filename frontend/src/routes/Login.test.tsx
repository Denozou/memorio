import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
  API_BASE_URL: 'http://localhost:8080',
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.email': 'Email',
        'common.password': 'Password',
        'common.login': 'Login',
        'common.loading': 'Loading...',
        'common.signup': 'Sign Up',
        'auth.welcomeBack': 'Welcome back',
        'auth.signInToContinue': 'Sign in to continue',
        'auth.forgotPassword': 'Forgot password?',
        'auth.orContinueWith': 'or continue with',
        'auth.continueWithGoogle': 'Continue with Google',
        'auth.continueWithFacebook': 'Continue with Facebook',
        'auth.dontHaveAccount': "Don't have an account?",
        'auth.loginFailed': 'Login failed',
        'auth.oauth2Failed': 'OAuth2 login failed',
        'auth.oauth2Missing': 'OAuth2 tokens missing',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
}));

// Mock ThemeToggle and LanguageSelector
vi.mock('../components/ThemeToggle', () => ({
  default: () => <button>Theme Toggle</button>,
}));

vi.mock('../components/LanguageSelector', () => ({
  default: () => <div>Language Selector</div>,
}));

function TestLoginApp({ initialEntry = '/login' }: { initialEntry?: string }) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/signup" element={<div>SignUp Page</div>} />
        <Route path="/auth/2fa/verify" element={<div>2FA Verify</div>} />
        <Route path="/auth/forgot-password" element={<div>Forgot Password</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Login', () => {
  let apiMock: typeof import('../lib/api').api;

  beforeEach(async () => {
    vi.clearAllMocks();
    const apiModule = await import('../lib/api');
    apiMock = apiModule.api;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders login form', () => {
      render(<TestLoginApp />);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('renders OAuth buttons', () => {
      render(<TestLoginApp />);

      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      render(<TestLoginApp />);

      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('renders sign up link', () => {
      render(<TestLoginApp />);

      // There are two Sign Up links (header and footer), get the one in the footer
      const signUpLinks = screen.getAllByText('Sign Up');
      expect(signUpLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Form interaction', () => {
    it('allows typing in email field', async () => {
      const user = userEvent.setup();
      render(<TestLoginApp />);

      const emailInput = screen.getByLabelText('Email');
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('allows typing in password field', async () => {
      const user = userEvent.setup();
      render(<TestLoginApp />);

      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      render(<TestLoginApp />);

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      await user.click(screen.getByLabelText('Show password'));
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(screen.getByLabelText('Hide password'));
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form submission', () => {
    it('submits form with email and password', async () => {
      const user = userEvent.setup();
      (apiMock.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          message: 'Login successful',
          user: { id: '1', email: 'test@example.com', displayName: 'Test', role: 'USER' },
          expiresAt: Date.now() + 3600000,
        },
      });

      render(<TestLoginApp />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(apiMock.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('redirects to dashboard on successful login', async () => {
      const user = userEvent.setup();
      (apiMock.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          message: 'Login successful',
          user: { id: '1', email: 'test@example.com', displayName: 'Test', role: 'USER' },
          expiresAt: Date.now() + 3600000,
        },
      });

      render(<TestLoginApp />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });

    it('redirects to 2FA page when required', async () => {
      const user = userEvent.setup();
      (apiMock.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          message: '2FA required',
          tempToken: 'temp-token-123',
          twoFactorRequired: true,
        },
      });

      render(<TestLoginApp />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText('2FA Verify')).toBeInTheDocument();
      });
    });

    it('displays error message on login failure', async () => {
      const user = userEvent.setup();
      (apiMock.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
        response: {
          data: { message: 'Invalid credentials' },
        },
      });

      render(<TestLoginApp />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
      });
    });

    it('disables form during submission', async () => {
      const user = userEvent.setup();
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      (apiMock.post as ReturnType<typeof vi.fn>).mockReturnValue(loginPromise);

      render(<TestLoginApp />);

      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /login/i }));

      expect(screen.getByLabelText('Email')).toBeDisabled();
      expect(screen.getByLabelText('Password')).toBeDisabled();

      // Cleanup
      resolveLogin!({ data: { message: 'ok' } });
    });
  });

  describe('OAuth error handling', () => {
    it('displays OAuth error from URL params', async () => {
      render(<TestLoginApp initialEntry="/login?error=oauth2_failed" />);

      await waitFor(() => {
        expect(screen.getByText('OAuth2 login failed')).toBeInTheDocument();
      });
    });

    it('displays OAuth missing tokens error', async () => {
      render(<TestLoginApp initialEntry="/login?error=oauth2_missing_tokens" />);

      await waitFor(() => {
        expect(screen.getByText('OAuth2 tokens missing')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation links', () => {
    it('has correct OAuth URLs', () => {
      render(<TestLoginApp />);

      const googleLink = screen.getByText('Continue with Google').closest('a');
      expect(googleLink).toHaveAttribute('href', 'http://localhost:8080/oauth2/authorization/google');

      const facebookLink = screen.getByText('Continue with Facebook').closest('a');
      expect(facebookLink).toHaveAttribute('href', 'http://localhost:8080/oauth2/authorization/facebook');
    });
  });
});
