import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SignUp from './SignUp';

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
        'auth.passwordsDontMatch': 'Passwords do not match',
        'auth.registerFailed': 'Registration failed',
        'common.signIn': 'Sign In',
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

function TestSignUpApp({ initialEntry = '/signup' }: { initialEntry?: string }) {
  return (
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SignUp', () => {
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
    it('renders signup form', () => {
      render(<TestSignUpApp />);

      expect(screen.getByText('Start learning today')).toBeInTheDocument();
      expect(screen.getByLabelText('Display Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders OAuth buttons', () => {
      render(<TestSignUpApp />);

      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
      expect(screen.getByText('Continue with Facebook')).toBeInTheDocument();
    });

    it('renders sign in link', () => {
      render(<TestSignUpApp />);

      expect(screen.getByText('Sign in')).toBeInTheDocument();
    });
  });

  describe('Password validation', () => {
    it('shows password requirements when typing', async () => {
      const user = userEvent.setup();
      render(<TestSignUpApp />);

      const passwordInput = screen.getByLabelText('Password');
      await user.type(passwordInput, 'a');

      expect(screen.getByText('At least 12 characters')).toBeInTheDocument();
      expect(screen.getByText('One uppercase letter (A-Z)')).toBeInTheDocument();
      expect(screen.getByText('One lowercase letter (a-z)')).toBeInTheDocument();
      expect(screen.getByText('One number (0-9)')).toBeInTheDocument();
      expect(screen.getByText(/One special character/)).toBeInTheDocument();
    });

    it('shows weak strength for short password', async () => {
      const user = userEvent.setup();
      render(<TestSignUpApp />);

      await user.type(screen.getByLabelText('Password'), 'abc');

      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('shows medium strength for partially valid password', async () => {
      const user = userEvent.setup();
      render(<TestSignUpApp />);

      await user.type(screen.getByLabelText('Password'), 'Abcdefghijkl');

      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('shows strong strength for fully valid password', async () => {
      const user = userEvent.setup();
      render(<TestSignUpApp />);

      await user.type(screen.getByLabelText('Password'), 'Abcdefghijk1!');

      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<TestSignUpApp />);

      await user.type(screen.getByLabelText('Display Name'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'ValidPass123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'DifferentPass123!');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      expect(apiMock.post).not.toHaveBeenCalled();
    });

    it('shows error when password requirements not met', async () => {
      const user = userEvent.setup();
      render(<TestSignUpApp />);

      await user.type(screen.getByLabelText('Display Name'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), 'weak');
      await user.type(screen.getByLabelText('Confirm Password'), 'weak');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Please meet all password requirements')).toBeInTheDocument();
      });

      expect(apiMock.post).not.toHaveBeenCalled();
    });
  });

  describe('Form submission', () => {
    const validPassword = 'Abcdefghijk1!';

    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      (apiMock.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          message: 'Registration successful',
          user: { id: '1', email: 'test@example.com', displayName: 'Test User', role: 'USER' },
          expiresAt: Date.now() + 3600000,
        },
      });

      render(<TestSignUpApp />);

      await user.type(screen.getByLabelText('Display Name'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), validPassword);
      await user.type(screen.getByLabelText('Confirm Password'), validPassword);
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(apiMock.post).toHaveBeenCalledWith('/auth/register', {
          displayName: 'Test User',
          email: 'test@example.com',
          password: validPassword,
          confirmPassword: validPassword,
          preferredLanguage: 'en',
        });
      });
    });

    it('redirects to dashboard on successful registration', async () => {
      const user = userEvent.setup();
      (apiMock.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        data: {
          message: 'Registration successful',
          user: { id: '1', email: 'test@example.com', displayName: 'Test User', role: 'USER' },
          expiresAt: Date.now() + 3600000,
        },
      });

      render(<TestSignUpApp />);

      await user.type(screen.getByLabelText('Display Name'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), validPassword);
      await user.type(screen.getByLabelText('Confirm Password'), validPassword);
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });

    it('displays error message on registration failure', async () => {
      const user = userEvent.setup();
      (apiMock.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
        response: {
          data: { error: 'Email already exists' },
        },
      });

      render(<TestSignUpApp />);

      await user.type(screen.getByLabelText('Display Name'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'existing@example.com');
      await user.type(screen.getByLabelText('Password'), validPassword);
      await user.type(screen.getByLabelText('Confirm Password'), validPassword);
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    it('disables form during submission', async () => {
      const user = userEvent.setup();
      let resolveRegister: (value: any) => void;
      const registerPromise = new Promise((resolve) => {
        resolveRegister = resolve;
      });
      (apiMock.post as ReturnType<typeof vi.fn>).mockReturnValue(registerPromise);

      render(<TestSignUpApp />);

      await user.type(screen.getByLabelText('Display Name'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), validPassword);
      await user.type(screen.getByLabelText('Confirm Password'), validPassword);
      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByLabelText('Display Name')).toBeDisabled();
      expect(screen.getByLabelText('Email')).toBeDisabled();

      // Cleanup
      resolveRegister!({ data: { message: 'ok' } });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      let resolveRegister: (value: any) => void;
      const registerPromise = new Promise((resolve) => {
        resolveRegister = resolve;
      });
      (apiMock.post as ReturnType<typeof vi.fn>).mockReturnValue(registerPromise);

      render(<TestSignUpApp />);

      await user.type(screen.getByLabelText('Display Name'), 'Test User');
      await user.type(screen.getByLabelText('Email'), 'test@example.com');
      await user.type(screen.getByLabelText('Password'), validPassword);
      await user.type(screen.getByLabelText('Confirm Password'), validPassword);
      await user.click(screen.getByRole('button', { name: /create account/i }));

      expect(screen.getByText('Creating account...')).toBeInTheDocument();

      // Cleanup
      resolveRegister!({ data: { message: 'ok' } });
    });
  });

  describe('Password visibility toggle', () => {
    it('toggles password field visibility', async () => {
      const user = userEvent.setup();
      render(<TestSignUpApp />);

      const passwordInput = screen.getByLabelText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');

      // There are two password toggle buttons, get the first one
      const toggleButtons = screen.getAllByLabelText('Show password');
      await user.click(toggleButtons[0]);
      expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('toggles confirm password field visibility', async () => {
      const user = userEvent.setup();
      render(<TestSignUpApp />);

      const confirmInput = screen.getByLabelText('Confirm Password');
      expect(confirmInput).toHaveAttribute('type', 'password');

      // Second toggle button is for confirm password
      const toggleButtons = screen.getAllByLabelText('Show password');
      await user.click(toggleButtons[1]);
      expect(confirmInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Navigation links', () => {
    it('has correct OAuth URLs', () => {
      render(<TestSignUpApp />);

      const googleLink = screen.getByText('Continue with Google').closest('a');
      expect(googleLink).toHaveAttribute('href', 'http://localhost:8080/oauth2/authorization/google');

      const facebookLink = screen.getByText('Continue with Facebook').closest('a');
      expect(facebookLink).toHaveAttribute('href', 'http://localhost:8080/oauth2/authorization/facebook');
    });
  });
});
