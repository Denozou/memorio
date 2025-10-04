import { activityTracker } from './activityTracker';
import { isAuthenticated, logout } from './auth';
import { api } from './api';

class SessionManager {
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  public async start() {
    // Check if user is authenticated with cookies
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return;
    }

    // Start activity tracking
    activityTracker.start();

    // Set up proactive token refresh on user activity
    activityTracker.onActivity(() => {
      this.handleUserActivity();
    });

    // Initial check for token refresh
    this.scheduleTokenRefresh();
  }

  public stop() {
    activityTracker.stop();
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private handleUserActivity() {
    // With HttpOnly cookies, we can't check token expiration client-side
    // Instead, we'll periodically refresh tokens on user activity
    if (!this.isRefreshing) {
      this.refreshTokenProactively();
    }
  }

  private async refreshTokenProactively() {
    if (this.isRefreshing) return;

    try {
      this.isRefreshing = true;
      console.log('Proactively refreshing token due to user activity...');

      // Make refresh request - cookies are sent automatically
      await api.post('/auth/refresh', {});

      console.log('Token refreshed successfully');
      this.scheduleTokenRefresh();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.logout();
    } finally {
      this.isRefreshing = false;
    }
  }

  private scheduleTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Schedule next refresh check in 5 minutes
    // Since we can't check token expiration client-side with HttpOnly cookies,
    // we refresh more frequently to ensure tokens stay valid
    this.refreshTimer = setTimeout(() => {
      this.refreshTokenProactively();
    }, 5 * 60 * 1000); // Check every 5 minutes
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
