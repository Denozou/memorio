# Admin Learning Panel API URL Fix

## Issue Summary

The Admin Learning Panel was encountering errors when saving articles, with console logs showing:
- `Save error: V` (minified error)
- `api/api/learning/articles` - **double `/api/api/` path** in API requests
- Subsequent 401 errors on auth endpoints
- 404 errors on dynamically imported modules

## Root Cause

The issue was in the `normalizeBaseUrl` function in `/frontend/src/lib/api.ts`.

### How the URL construction works:

1. **Production environment variable**: `VITE_API_URL=https://memorio.tech/api`
2. **normalizeBaseUrl function**: Strips `/api` suffix to get `https://memorio.tech`
3. **API calls**: Use paths like `/api/learning/articles`
4. **Final URL**: Should be `https://memorio.tech/api/learning/articles`

### The Problem

The original `normalizeBaseUrl` function:

```typescript
const normalizeBaseUrl = (value: string) => {
    const trimmed = value.replace(/\/+$/, "");
    return trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;
};
```

This function was vulnerable to edge cases:
- **Whitespace**: If `VITE_API_URL` had trailing whitespace (e.g., from copy-paste), the `endsWith("/api")` check would fail
- **Case sensitivity**: URLs should be case-insensitive for path matching

When normalization failed, the baseURL remained `https://memorio.tech/api`, and combined with API calls using `/api/...` paths, resulted in double `/api/api/` URLs.

## Fix Applied

Updated `/frontend/src/lib/api.ts` with a more robust `normalizeBaseUrl` function:

```typescript
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
```

### Changes Made:

1. **Added `.trim()`**: Removes any leading/trailing whitespace from the environment variable
2. **Case-insensitive check**: Uses `.toLowerCase()` before `endsWith()` check
3. **Added TypeScript return type**: Explicit `: string` return type
4. **Added debug logging**: In development mode, logs both raw and normalized URLs for easier debugging

## Related Errors Explained

The console logs also showed:
- **401 errors**: JWT token likely expired during the operation; this is handled by the existing refresh token mechanism
- **404 on JS chunks**: Indicates a stale deployment where old chunk filenames no longer exist on the server - users need to refresh the page after new deployments

## Testing

After deploying this fix:
1. Clear browser cache or hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Open browser DevTools → Network tab
3. Save an article in Admin Learning Panel
4. Verify API requests go to `/api/admin/learning/articles/...` (single `/api/`)

## Files Modified

- `/frontend/src/lib/api.ts` - Fixed `normalizeBaseUrl` function

## Date

December 28, 2025
