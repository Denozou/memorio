package com.memorio.backend.common.security;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bandwidth;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig {
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public Bucket resolveLoginBucket(String key){
        return cache.computeIfAbsent(key, k->createLoginBucket());
    }

    public Bucket resolveRegisterBucket(String key){
        return cache.computeIfAbsent(key, k -> createRegisterBucket());
    }
    public Bucket resolveRefreshBucket(String key){
        return cache.computeIfAbsent(key, k -> createRefreshBucket());
    }

    private Bucket createLoginBucket(){
        Bandwidth limit = Bandwidth.builder()
                .capacity(5)
                .refillIntervally(5, Duration.ofMinutes(1))
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
        Bandwidth limit = Bandwidth.builder()
                .capacity(10)
                .refillIntervally(10, Duration.ofMinutes(1))
                .build();
        return Bucket.builder()
                .addLimit(limit)
                .build();

    }
}
