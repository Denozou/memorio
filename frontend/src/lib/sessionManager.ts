import { activityTracker } from './activityTracker';
import { isAuthenticated, logout } from './auth';
import { api } from './api';
import axios, { AxiosError } from 'axios';

const TOKEN_EXPIRATION_KEY = 'token_expiration';
const REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiration
const MIN_REFRESH_INTERVAL_MS = 30 * 1000; // Minimum 30 seconds between refreshes

class SessionManager {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private isRefreshing = false;
  private lastRefreshAttempt: number = 0;
  private backoffDelay: number = 0;
  private tokenExpiresAt: number | null = null;

  public async start() {
    // Check if user is authenticated with cookies
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return;
    }

    // Load stored token expiration
    this.loadTokenExpiration();

    // Start activity tracking
    activityTracker.start();

    // Set up smart token refresh on user activity
    activityTracker.onActivity(() => {
      this.handleUserActivity();
    });

    // Initial token refresh check
    this.scheduleTokenRefresh();
  }

  public stop() {
    activityTracker.stop();
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.clearTokenExpiration();
  }

  private handleUserActivity() {
    // Only refresh if token is near expiration
    if (this.shouldRefreshToken() && !this.isRefreshing) {
      this.refreshTokenProactively();
    }
  }

  private shouldRefreshToken(): boolean {
    if (!this.tokenExpiresAt) {
      // If we don't know expiration, be conservative and refresh
      return true;
    }

    const now = Date.now();
    const timeUntilExpiration = this.tokenExpiresAt - now;

    // Refresh if token expires in less than REFRESH_BUFFER_MS
    return timeUntilExpiration <= REFRESH_BUFFER_MS;
  }

  private async refreshTokenProactively() {
    if (this.isRefreshing) return;

    const now = Date.now();
    const timeSinceLastRefresh = now - this.lastRefreshAttempt;

    // Prevent refresh storms - enforce minimum interval
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
      console.log('Skipping refresh - too soon since last attempt');
      return;
    }

    try {
      this.isRefreshing = true;
      this.lastRefreshAttempt = now;
      
      console.log('Refreshing token...');

      // Make refresh request - cookies are sent automatically
      const response = await api.post<{ expiresAt: number }>('/auth/refresh', {});

      // Store new expiration time
      if (response.data.expiresAt) {
        this.tokenExpiresAt = response.data.expiresAt;
        this.saveTokenExpiration();
      }

      // Reset backoff on success
      this.backoffDelay = 0;

      console.log('Token refreshed successfully, expires at:', new Date(this.tokenExpiresAt || 0).toLocaleString());
      this.scheduleTokenRefresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Handle rate limiting with exponential backoff
        if (axiosError.response?.status === 429) {
          this.backoffDelay = Math.min(this.backoffDelay * 2 || 30000, 300000); // 30s to 5min max
          console.warn(`Rate limited. Backing off for ${this.backoffDelay / 1000}s`);
          
          // Schedule retry with backoff
          this.scheduleTokenRefresh(this.backoffDelay);
          this.isRefreshing = false;
          return;
        }
        
        // Handle other authentication errors
        if (axiosError.response?.status === 401) {
          console.error('Token refresh failed - authentication error');
          this.logout();
          return;
        }
      }

      console.error('Failed to refresh token:', error);
      // Don't logout immediately on network errors - retry with backoff
      this.backoffDelay = Math.min(this.backoffDelay * 2 || 5000, 60000);
      this.scheduleTokenRefresh(this.backoffDelay);
    } finally {
      this.isRefreshing = false;
    }
  }

  private scheduleTokenRefresh(delayMs?: number) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    let delay: number;

    if (delayMs !== undefined) {
      // Use provided delay (for backoff)
      delay = delayMs;
    } else if (this.tokenExpiresAt) {
      // Calculate optimal refresh time
      const now = Date.now();
      const timeUntilExpiration = this.tokenExpiresAt - now;
      const timeUntilRefresh = timeUntilExpiration - REFRESH_BUFFER_MS;

      // Refresh 5 minutes before expiration, but at least check every 10 minutes
      delay = Math.max(Math.min(timeUntilRefresh, 10 * 60 * 1000), 60 * 1000);
    } else {
      // Default: check every 10 minutes if we don't know expiration
      delay = 10 * 60 * 1000;
    }

    console.log(`Next token refresh check in ${Math.round(delay / 1000)}s`);

    this.refreshTimer = setTimeout(() => {
      this.refreshTokenProactively();
    }, delay);
  }

  private saveTokenExpiration() {
    if (this.tokenExpiresAt) {
      try {
        localStorage.setItem(TOKEN_EXPIRATION_KEY, this.tokenExpiresAt.toString());
      } catch (e) {
        console.warn('Failed to save token expiration:', e);
      }
    }
  }

  private loadTokenExpiration() {
    try {
      const stored = localStorage.getItem(TOKEN_EXPIRATION_KEY);
      if (stored) {
        this.tokenExpiresAt = parseInt(stored, 10);
      }
    } catch (e) {
      console.warn('Failed to load token expiration:', e);
    }
  }

  private clearTokenExpiration() {
    try {
      localStorage.removeItem(TOKEN_EXPIRATION_KEY);
    } catch (e) {
      console.warn('Failed to clear token expiration:', e);
    }
    this.tokenExpiresAt = null;
  }

  private logout() {
    console.log('Session expired, logging out...');
    this.stop();
    logout(); // This will call the logout endpoint and redirect
  }

  public getInactivityDuration(): number {
    return activityTracker.getInactivityDuration();
  }

  public getLastActivity(): number {
    return activityTracker.getLastActivity();
  }
}

export const sessionManager = new SessionManager();
