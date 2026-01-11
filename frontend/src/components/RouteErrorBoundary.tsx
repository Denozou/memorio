import { useEffect, useState } from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft, RefreshCw, Wifi } from 'lucide-react';

/**
 * Check if error is a module loading failure (common during Vite HMR)
 */
function isModuleLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('unable to preload')
  );
}

/**
 * Route Error Boundary for React Router.
 * Handles 404s, module loading failures, and other route-level errors.
 */
export default function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);

  const isModuleError = isModuleLoadError(error);

  // Auto-reload for module loading errors (once)
  useEffect(() => {
    if (isModuleError && !isRetrying) {
      const retryKey = 'module_error_auto_retry';
      const hasRetried = sessionStorage.getItem(retryKey);

      if (!hasRetried) {
        sessionStorage.setItem(retryKey, 'true');
        setIsRetrying(true);
        // Small delay to show user something is happening
        setTimeout(() => window.location.reload(), 500);
      } else {
        // Clear for next time
        sessionStorage.removeItem(retryKey);
      }
    }
  }, [isModuleError, isRetrying]);

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';
  let statusCode: number | null = null;

  if (isRetrying) {
    title = 'Reconnecting...';
    message = 'The page is being refreshed automatically.';
  } else if (isModuleError) {
    title = 'Connection issue';
    message = 'Failed to load the page. This can happen during development updates or network issues.';
  } else if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    switch (error.status) {
      case 404:
        title = 'Page not found';
        message = "The page you're looking for doesn't exist or has been moved.";
        break;
      case 401:
        title = 'Unauthorized';
        message = 'You need to be logged in to access this page.';
        break;
      case 403:
        title = 'Access denied';
        message = "You don't have permission to access this page.";
        break;
      case 500:
        title = 'Server error';
        message = 'Something went wrong on our end. Please try again later.';
        break;
      default:
        title = `Error ${error.status}`;
        message = error.statusText || 'An error occurred.';
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="max-w-md w-full text-center">
        {/* Status Code */}
        {statusCode && (
          <div className="text-8xl font-bold text-indigo-600/20 dark:text-indigo-400/20 mb-4">
            {statusCode}
          </div>
        )}

        {/* Error Icon */}
        {!statusCode && (
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            isModuleError || isRetrying
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
          }`}>
            {isModuleError || isRetrying ? (
              <Wifi className={`w-10 h-10 text-blue-600 dark:text-blue-400 ${isRetrying ? 'animate-pulse' : ''}`} />
            ) : (
              <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            )}
          </div>
        )}

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isRetrying && (
            <>
              {/* Show reload as primary for module errors */}
              {isModuleError ? (
                <button
                  onClick={handleReload}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </button>
              ) : (
                <button
                  onClick={handleGoHome}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              )}
              <button
                onClick={handleGoBack}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
              {statusCode && statusCode >= 500 && (
                <button
                  onClick={handleReload}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload
                </button>
              )}
            </>
          )}
          {isRetrying && (
            <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-slate-500 dark:text-slate-400 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Refreshing...
            </div>
          )}
        </div>

        {/* Development Mode: Show Error Details */}
        {import.meta.env.DEV && error instanceof Error && (
          <details className="mt-8 text-left bg-white dark:bg-slate-900 rounded-xl p-4 shadow-lg">
            <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400">
              Developer Details
            </summary>
            <pre className="mt-4 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-auto max-h-48 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
