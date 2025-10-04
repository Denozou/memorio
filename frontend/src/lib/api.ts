import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { logout } from "./auth";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const api = axios.create({
    baseURL: BASE,
    withCredentials: true // Enable cookies for all requests
});

api.interceptors.request.use((config) => {
    // No need to set Authorization header - cookies are sent automatically
    // Just ensure credentials are included
    config.withCredentials = true;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    async (error: AxiosError) => {
        const original = error.config;
        if (!original || (original as any)._retry) throw error;

        // If we get 401, it means our cookies are invalid/expired
        if (error.response?.status === 401) {
            // Try to refresh token by making a request to refresh endpoint
            // If refresh fails, logout the user
            try {
                // Attempt token refresh - this will set new cookies if successful
                await api.post('/auth/refresh', {});

                // Retry the original request
                (original as any)._retry = true;
                return api(original);
            } catch (refreshError) {
                // Refresh failed - logout user
                console.log('Token refresh failed, logging out...');
                logout();
                throw error;
            }
        }

        throw error;
    }
);

function redirectToLogin() {
    if (typeof window !== "undefined") window.location.href = "/login";
}