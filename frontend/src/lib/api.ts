import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "./auth";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export const api = axios.create({ baseURL: BASE });
// NEW: a “bare” client with NO interceptors, used only for refresh:
const authApi = axios.create({ baseURL: BASE });

let refreshPromise: Promise<void> | null = null;

function setAuthHeader(config: AxiosRequestConfig) {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
}

api.interceptors.request.use((config) => {
  // no proactive refresh anymore (keeps things simple)
  setAuthHeader(config);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    if (!original || (original as any)._retry) throw error;
    if (error.response?.status !== 401) throw error;

    // If the failing call was refresh itself, log out
    if (original.url?.includes("/auth/refresh")) {
      clearTokens();
      redirectToLogin();
      throw error;
    }

    const rt = getRefreshToken();
    if (!rt) {
      clearTokens();
      redirectToLogin();
      throw error;
    }

    try {
      // Ensure only one refresh in flight
      refreshPromise = refreshPromise ?? doRefresh(rt);
      await refreshPromise;
      refreshPromise = null;

      (original as any)._retry = true;
      setAuthHeader(original);
      return api(original);
    } catch {
      clearTokens();
      redirectToLogin();
      throw error;
    }
  }
);

function redirectToLogin() {
  if (typeof window !== "undefined") window.location.href = "/login";
}

// IMPORTANT: use the bare client so interceptors don’t run on refresh
async function doRefresh(refreshToken: string): Promise<void> {
  const { data } = await authApi.post<{ accessToken: string; tokenType: string; expiresAt: string }>(
    "/auth/refresh",
    { refreshToken }
  );
  saveTokens({
    accessToken: data.accessToken,
    tokenType: data.tokenType,
    accessExp: data.expiresAt,
    refreshToken, // keep the same refresh
  });
}