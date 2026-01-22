import { lazy, type ComponentType } from 'react';

type LazyImport<T extends ComponentType<any>> = () => Promise<{ default: T }>;

/**
 * Checks if an error is a chunk/module loading failure.
 * Covers Vite, Webpack, and various browser-specific error messages.
 */
function isChunkLoadError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message || '';
  const name = (err as any).name || '';
  return (
    name === 'ChunkLoadError' ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('Unable to preload') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('dynamically imported module')
  );
}

/**
 * Wrapper for React.lazy that handles module loading failures.
 *
 * When Vite's dev server updates modules during HMR, stale module URLs
 * (with old timestamps) can fail to load. This wrapper:
 * 1. Attempts to load the module
 * 2. On failure, retries after a short delay
 * 3. If retries fail, triggers a page refresh to get fresh module references
 *
 * In production, this handles stale chunks after deployments and network flakiness.
 *
 * @param importFn - Dynamic import function
 * @param key - Stable identifier for the chunk (e.g., route name)
 * @param options - Optional retry configuration
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: LazyImport<T>,
  key: string,
  options: { maxRetries?: number; retryDelayMs?: number } = {}
): React.LazyExoticComponent<T> {
  const { maxRetries = 1, retryDelayMs = 1000 } = options;

  return lazy(async () => {
    // SSR guard - sessionStorage/window not available during server-side rendering
    const canUseStorage = typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
    const sessionKey = `module_refresh_${key}`;
    const hasRefreshed = canUseStorage ? sessionStorage.getItem(sessionKey) : null;

    try {
      return await importFn();
    } catch (error) {
      // Only handle chunk loading errors, rethrow others
      if (!isChunkLoadError(error)) throw error;

      // Retry logic
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        await new Promise((r) => setTimeout(r, retryDelayMs));
        try {
          return await importFn();
        } catch {
          // Continue to next retry
        }
      }

      // All retries failed - refresh the page if we haven't already
      if (typeof window !== 'undefined' && !hasRefreshed) {
        if (canUseStorage) sessionStorage.setItem(sessionKey, 'true');
        window.location.reload();
        // Return a never-resolving promise to prevent the error UI from flashing
        return new Promise<never>(() => {});
      }

      // Clear the flag so future attempts can try again
      if (canUseStorage) sessionStorage.removeItem(sessionKey);
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
