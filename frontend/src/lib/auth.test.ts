import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isAuthenticated,
  getCurrentUser,
  logout,
  saveTokens,
  getAccessToken,
  getRefreshToken,
  getTokenType,
  getAccessExp,
  clearTokens,
  isAccessExpired,
  isAccessExpiringSoon,
  getTokenTimeRemaining,
  AuthUser,
} from './auth';

describe('Auth Utilities', () => {
  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'USER',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn();
    // Mock console methods
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAuthenticated', () => {
    it('returns true when auth check succeeds', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      const result = await isAuthenticated();

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/auth/check', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('returns false when auth check fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
      });

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });

    it('returns false when fetch throws an error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('returns user data when request succeeds', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith('/api/user/profile', {
        method: 'GET',
        credentials: 'include',
      });
    });

    it('returns null when request fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('returns null when fetch throws an error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('calls logout endpoint and redirects to login', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      await logout();

      expect(global.fetch).toHaveBeenCalledWith('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      expect(window.location.href).toBe('/login');
    });

    it('redirects to login even when logout request fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await logout();

      expect(console.error).toHaveBeenCalledWith(
        'Logout error:',
        expect.any(Error)
      );
      expect(window.location.href).toBe('/login');
    });
  });

  describe('Deprecated token functions', () => {
    it('saveTokens logs a deprecation warning', () => {
      saveTokens();

      expect(console.warn).toHaveBeenCalledWith(
        'saveTokens() is deprecated with cookie-based authentication'
      );
    });

    it('getAccessToken logs a warning and returns null', () => {
      const result = getAccessToken();

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'getAccessToken() is deprecated with cookie-based authentication'
      );
    });

    it('getRefreshToken logs a warning and returns null', () => {
      const result = getRefreshToken();

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'getRefreshToken() is deprecated with cookie-based authentication'
      );
    });
  });

  describe('No-op token functions', () => {
    it('getTokenType returns "Bearer"', () => {
      expect(getTokenType()).toBe('Bearer');
    });

    it('getAccessExp returns null', () => {
      expect(getAccessExp()).toBeNull();
    });

    it('isAccessExpired returns false', () => {
      expect(isAccessExpired()).toBe(false);
    });

    it('isAccessExpiringSoon returns false', () => {
      expect(isAccessExpiringSoon()).toBe(false);
    });

    it('getTokenTimeRemaining returns 0', () => {
      expect(getTokenTimeRemaining()).toBe(0);
    });

    it('clearTokens calls logout', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
      });

      clearTokens();

      // clearTokens calls logout which is async, so fetch should be called
      expect(global.fetch).toHaveBeenCalledWith('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    });
  });
});
