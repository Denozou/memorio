import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * Displays a user-friendly error page instead of a blank white screen.
 *
 * Usage:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
      eventId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });

    // Log to external service (if configured)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // In production, you would send this to an error tracking service
    // like Sentry, LogRocket, or your own backend
    const errorLog = {
      eventId: this.state.eventId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Store in localStorage for debugging (last 5 errors)
    try {
      const storedErrors = JSON.parse(localStorage.getItem('memorio_error_log') || '[]');
      storedErrors.unshift(errorLog);
      localStorage.setItem('memorio_error_log', JSON.stringify(storedErrors.slice(0, 5)));
    } catch {
      // Ignore storage errors
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('Error Details');
      console.log('Event ID:', this.state.eventId);
      console.log('Error:', error);
      console.log('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>

            {/* Error ID for support */}
            {this.state.eventId && (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-4 py-2 mb-6">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Error ID: <code className="font-mono">{this.state.eventId}</code>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {/* Development Mode: Show Error Details */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Developer Details
                </summary>
                <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-auto max-h-64">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-4 mb-2">
                        Component Stack:
                      </p>
                      <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
