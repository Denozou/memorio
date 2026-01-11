package com.memorio.backend.common.security;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class RateLimitService {
    private final RateLimitConfig rateLimitConfig;
    private final ClientIpResolver clientIpResolver;

    public RateLimitService(RateLimitConfig rateLimitConfig, ClientIpResolver clientIpResolver) {
        this.rateLimitConfig = rateLimitConfig;
        this.clientIpResolver = clientIpResolver;
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
     * Securely extracts the client IP address from the request.
     *
     * <p>Delegates to {@link ClientIpResolver} which validates that forwarded
     * headers only come from trusted proxies, preventing IP spoofing attacks
     * that could bypass rate limiting.</p>
     *
     * @param request The HTTP servlet request
     * @return The validated client IP address
     */
    private String getClientIP(HttpServletRequest request) {
        return clientIpResolver.resolveClientIp(request);
    }
}