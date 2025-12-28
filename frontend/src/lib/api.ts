import axios, { AxiosError } from "axios";
import { logout } from "./auth";

/**
 * Normalize the backend base URL so we don't accidentally double-prefix `/api`
 * when VITE_API_URL includes it (e.g., https://memorio.tech/api).
 */
const normalizeBaseUrl = (value: string): string => {
    // Trim whitespace and trailing slashes
    const trimmed = value.trim().replace(/\/+$/, "");
    // Remove /api suffix if present (case-insensitive check for robustness)
    if (trimmed.toLowerCase().endsWith("/api")) {
        return trimmed.slice(0, -4);
    }
    return trimmed;
};

const rawApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
export const API_BASE_URL = normalizeBaseUrl(rawApiUrl);

// Debug log in development
if (import.meta.env.DEV) {
    console.log("[API] Raw VITE_API_URL:", rawApiUrl);
    console.log("[API] Normalized API_BASE_URL:", API_BASE_URL);
}

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true // Enable cookies for all requests
});

api.interceptors.request.use((config) => {
    config.withCredentials = true;
    return config;
});

let isRefreshing = false;

// Check if current page is a public page that doesn't require auth
const isPublicPage = () => {
    const publicPaths = ['/login', '/signup', '/auth/verify-email', '/auth/forgot-password', '/auth/reset-password', '/auth/2fa/verify', '/landing', '/'];
    return publicPaths.some(path => window.location.pathname === path || window.location.pathname.startsWith(path));
};

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config;
        if (!original || (original as any)._retry) throw error;

        // Don't try to refresh if the failed request was the refresh itself
        if (original.url?.includes('/auth/refresh')) {
            console.log('Refresh token expired or invalid');
            // Only logout if not on a public page
            if (!isPublicPage()) {
                setTimeout(() => logout(), 100);
                // Return a promise that never resolves to prevent error display while redirecting
                return new Promise(() => {});
            }
            throw error;
        }

        if (error.response?.status === 401 && !isRefreshing) {
            // If we're on a public page, don't try to refresh or logout
            if (isPublicPage()) {
                throw error;
            }

            isRefreshing = true;
            try {
                await api.post('/auth/refresh', {});
                (original as any)._retry = true;
                isRefreshing = false;
                return api(original);
            } catch (refreshError) {
                // Refresh failed - logout user
                isRefreshing = false;
                console.log('Token refresh failed, logging out...');
                setTimeout(() => logout(), 100);
                // Return a promise that never resolves to prevent error display while redirecting
                return new Promise(() => {});
            }
        }

        throw error;
    }
);
