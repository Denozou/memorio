// Tokens are now stored in secure HttpOnly cookies and managed by the server
import { api } from './api';

export type AuthUser = {
    id: string;
    email: string;
    displayName: string;
    role: string;
};

/**
 * Check if user is authenticated by making a request to a protected endpoint.
 * Uses the shared axios instance for automatic token refresh on 401.
 */
export async function isAuthenticated(): Promise<boolean> {
    try {
        const response = await api.get('/auth/check');
        return response.status === 200;
    } catch {
        return false;
    }
}

/**
 * Get current user information (if authenticated).
 * Uses /users/profile (correct backend path) via shared axios instance.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const response = await api.get('/users/profile');
        return response.data;
    } catch {
        return null;
    }
}

/**
 * Clear authentication by calling logout endpoint.
 * Note: We don't use the shared axios instance here to avoid
 * triggering refresh logic during logout.
 */
export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout');
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always redirect to login page, even if logout fails
        window.location.href = '/login';
    }
}


// These are no longer needed with HttpOnly cookies but kept to avoid breaking existing code

export function saveTokens(): void {
    // No-op: tokens are managed by HttpOnly cookies
    console.warn('saveTokens() is deprecated with cookie-based authentication');
}

export function getAccessToken(): string | null {
    // No-op: cannot access HttpOnly cookies from JavaScript
    console.warn('getAccessToken() is deprecated with cookie-based authentication');
    return null;
}

export function getRefreshToken(): string | null {
    // No-op: cannot access HttpOnly cookies from JavaScript
    console.warn('getRefreshToken() is deprecated with cookie-based authentication');
    return null;
}

export function getTokenType(): string {
    return "Bearer";
}

export function getAccessExp(): string | null {
    // No-op: token expiration is handled server-side
    return null;
}

export function clearTokens(): void {
    // Use logout function instead
    logout();
}

export function isAccessExpired(): boolean {
    // No-op: cannot check token expiration from client-side with HttpOnly cookies
    return false;
}

export function isAccessExpiringSoon(): boolean {
    // No-op: proactive refresh is handled by server-side token validation
    return false;
}

export function getTokenTimeRemaining(): number {
    // No-op: cannot calculate remaining time with HttpOnly cookies
    return 0;
}