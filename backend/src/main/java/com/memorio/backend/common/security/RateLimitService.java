package com.memorio.backend.common.security;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;

@Service
public class RateLimitService {
    private final RateLimitConfig rateLimitConfig;
    public  RateLimitService(RateLimitConfig rateLimitConfig){
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


    private String getClientIP(HttpServletRequest request){
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()){
            return  request.getRemoteAddr();
        }
        return  xfHeader.split(",")[0].trim();
    }
}
