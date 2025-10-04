// Activity tracker for monitoring user interactions
// Used by session manager to detect user activity and manage token refresh

class ActivityTracker {
  private lastActivity: number = Date.now();
  private activityCallbacks: (() => void)[] = [];
  private isTracking = false;
  private events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

  public start() {
    if (this.isTracking) return;

    this.isTracking = true;
    this.lastActivity = Date.now();

    // Add event listeners for user activity
    this.events.forEach(event => {
      document.addEventListener(event, this.handleActivity, { passive: true });
    });
  }

  public stop() {
    if (!this.isTracking) return;

    this.isTracking = false;

    // Remove event listeners
    this.events.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });

    // Clear callbacks
    this.activityCallbacks = [];
  }

  public onActivity(callback: () => void) {
    this.activityCallbacks.push(callback);
  }

  public getLastActivity(): number {
    return this.lastActivity;
  }

  public getInactivityDuration(): number {
    return Date.now() - this.lastActivity;
  }

  public isUserActive(thresholdMs: number = 30 * 60 * 1000): boolean {
    return this.getInactivityDuration() < thresholdMs;
  }

  private handleActivity = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;

    // Only trigger callbacks if enough time has passed (debounce)
    if (timeSinceLastActivity > 1000) { // 1 second debounce
      this.lastActivity = now;

      // Notify all callbacks
      this.activityCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Activity callback error:', error);
        }
      });
    } else {
      // Update last activity time without triggering callbacks
      this.lastActivity = now;
    }
  };
}

export const activityTracker = new ActivityTracker();
