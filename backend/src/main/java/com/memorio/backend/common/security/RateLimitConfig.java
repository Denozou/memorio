package com.memorio.backend.common.security;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bandwidth;
import org.springframework.context.annotation.Configuration;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig {
    private final Cache<String, Bucket> cache = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofHours(1))
            .maximumSize(10_000)
            .build();

    public Bucket resolveLoginBucket(String key){
        return cache.get(key, k->createLoginBucket());
    }

    public Bucket resolveRegisterBucket(String key){
        return cache.get(key, k -> createRegisterBucket());
    }
    public Bucket resolveRefreshBucket(String key){
        return cache.get(key, k -> createRefreshBucket());
    }

    private Bucket createLoginBucket(){
        // Allow 20 login attempts per minute per IP
        // This is higher than the 5 failed attempts per email lockout
        // so email-based blocking takes precedence
        Bandwidth limit = Bandwidth.builder()
                .capacity(20)
                .refillIntervally(20, Duration.ofMinutes(1))
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    //3 requests per hour
    private Bucket createRegisterBucket(){
        Bandwidth limit = Bandwidth.builder()
                .capacity(3)
                .refillIntervally(3, Duration.ofHours(1))
                .build();

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket createRefreshBucket(){
        // Allow 30 refresh attempts per minute per IP
        // With smart client-side refresh logic, active users should only need 1-2 per hour
        // This provides buffer for legitimate use while preventing abuse
        Bandwidth limit = Bandwidth.builder()
                .capacity(30)
                .refillIntervally(30, Duration.ofMinutes(1))
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();

    }
}
