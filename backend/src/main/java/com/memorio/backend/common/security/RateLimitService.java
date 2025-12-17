package com.memorio.backend.common.security;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class RateLimitService {
    private final RateLimitConfig rateLimitConfig;

    public RateLimitService(RateLimitConfig rateLimitConfig){
        this.rateLimitConfig = rateLimitConfig;
    }

    public boolean allowLogin(HttpServletRequest request){
        String key = getClientIP(request);
        Bucket bucket = rateLimitConfig.resolveLoginBucket(key);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        return probe.isConsumed();
    }

    public boolean allowRegister(HttpServletRequest request){
        String key = getClientIP(request);
        Bucket bucket = rateLimitConfig.resolveRegisterBucket(key);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        return probe.isConsumed();
    }

    public boolean allowRefresh(HttpServletRequest request){
        String key = getClientIP(request);
        Bucket bucket = rateLimitConfig.resolveRefreshBucket(key);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        return probe.isConsumed();
    }

    /**
     * Extracts the client IP address from the request, checking proxy headers first.
     * Handles scenarios where the application is behind a reverse proxy or load balancer.
     */
    private String getClientIP(HttpServletRequest request) {
        // Try standard proxy headers in order of preference
        String[] headers = {
                "X-Forwarded-For",    // Standard, most common
                "X-Real-IP",          // Nginx
                "CF-Connecting-IP",   // Cloudflare
                "Proxy-Client-IP",    // Apache
                "WL-Proxy-Client-IP"  // WebLogic
        };

        for (String header : headers) {
            String ip = extractIPFromHeader(request, header);
            if (ip != null) {
                return ip;
            }
        }

        // Fallback to remote address (direct connection)
        return request.getRemoteAddr();
    }


    private String extractIPFromHeader(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);

        if (value == null || value.isEmpty() || "unknown".equalsIgnoreCase(value)) {
            return null;
        }

        int commaIndex = value.indexOf(',');
        if (commaIndex != -1) {
            value = value.substring(0, commaIndex).trim();
        } else {
            value = value.trim();
        }

        if (isValidIP(value)) {
            return value;
        }

        return null;
    }
    private boolean isValidIP(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }

        // IPv4 validation
        if (ip.matches("^(\\d{1,3}\\.){3}\\d{1,3}$")) {
            String[] parts = ip.split("\\.");
            for (String part : parts) {
                try {
                    int num = Integer.parseInt(part);
                    if (num < 0 || num > 255) {
                        return false;
                    }
                } catch (NumberFormatException e) {
                    return false;
                }
            }
            return true;
        }

        // IPv6 validation (basic check)
        if (ip.contains(":") && ip.matches("^[0-9a-fA-F:]+$")) {
            return true;
        }

        return false;
    }
}