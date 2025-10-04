// Cookie-based authentication utilities
// Tokens are now stored in secure HttpOnly cookies and managed by the server

export type AuthUser = {
    id: string;
    email: string;
    displayName: string;
    role: string;
};

// Check if user is authenticated by making a request to a protected endpoint
export async function isAuthenticated(): Promise<boolean> {
    try {
        // Make a simple request to check if we have valid authentication cookies
        const response = await fetch('/api/auth/check', {
            method: 'GET',
            credentials: 'include', // Include cookies in request
        });
        return response.ok;
    } catch {
        return false;
    }
}

// Get current user information (if authenticated)
export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const response = await fetch('/api/user/profile', {
            method: 'GET',
            credentials: 'include',
        });

        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch {
        return null;
    }
}

// Clear authentication by calling logout endpoint
export async function logout(): Promise<void> {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    // Redirect to login page
    window.location.href = '/login';
}

// Legacy functions kept for compatibility but simplified
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