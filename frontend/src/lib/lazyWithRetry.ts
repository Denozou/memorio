import { lazy, type ComponentType } from 'react';

/**
 * Wrapper for React.lazy that handles Vite HMR module loading failures.
 *
 * When Vite's dev server updates modules during HMR, stale module URLs
 * (with old timestamps) can fail to load. This wrapper:
 * 1. Attempts to load the module
 * 2. On failure, retries once after a short delay
 * 3. If retry fails, triggers a page refresh to get fresh module references
 *
 * In production, this handles rare cases of network flakiness or CDN cache issues.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  retries = 1,
  retryDelay = 1000
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    // Track if we've already refreshed to prevent infinite loops
    const sessionKey = `module_refresh_${importFn.toString().slice(0, 100)}`;
    const hasRefreshed = sessionStorage.getItem(sessionKey);

    try {
      return await importFn();
    } catch (error) {
      // Check if this is a module loading error (common during HMR)
      const isModuleError =
        error instanceof Error &&
        (error.message.includes('Failed to fetch dynamically imported module') ||
         error.message.includes('Loading chunk') ||
         error.message.includes('Loading CSS chunk') ||
         error.message.includes('Unable to preload'));

      if (!isModuleError) {
        throw error;
      }

      // Retry logic
      for (let attempt = 0; attempt < retries; attempt++) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        try {
          return await importFn();
        } catch {
          // Continue to next retry
        }
      }

      // All retries failed - refresh the page if we haven't already
      if (!hasRefreshed) {
        sessionStorage.setItem(sessionKey, 'true');
        window.location.reload();
        // Return a never-resolving promise to prevent the error UI from flashing
        return new Promise(() => {});
      }

      // Clear the flag so future attempts can try again
      sessionStorage.removeItem(sessionKey);
      throw error;
    }
  });
}

/**
 * Preload a lazy component to avoid loading delays on navigation.
 * Call this on hover/focus of navigation links.
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<unknown> }>
): void {
  importFn().catch(() => {
    // Silently ignore preload failures - they'll be handled on actual navigation
  });
}
