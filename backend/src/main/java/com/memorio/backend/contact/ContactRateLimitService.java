package com.memorio.backend.contact;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Rate limiting service specifically for contact form submissions.
 * Uses token bucket algorithm with Caffeine cache for per-IP limiting.
 */
@Service
public class ContactRateLimitService {

    private final Cache<String, Bucket> contactBucketCache;

    public ContactRateLimitService() {
        this.contactBucketCache = Caffeine.newBuilder()
                .expireAfterAccess(Duration.ofHours(2))
                .maximumSize(10_000)
                .build();
    }

    /**
     * Checks if a contact form submission is allowed from the given IP.
     * Allows 5 submissions per hour per IP address.
     *
     * @param ipAddress The client's IP address
     * @return true if the submission is allowed, false if rate limited
     */
    public boolean allowContactSubmission(String ipAddress) {
        Bucket bucket = contactBucketCache.get(ipAddress, this::createContactBucket);
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        return probe.isConsumed();
    }

    /**
     * Gets the remaining number of submissions allowed for an IP.
     *
     * @param ipAddress The client's IP address
     * @return Number of remaining submissions
     */
    public long getRemainingSubmissions(String ipAddress) {
        Bucket bucket = contactBucketCache.get(ipAddress, this::createContactBucket);
        return bucket.getAvailableTokens();
    }

    /**
     * Creates a rate limit bucket for contact form submissions.
     * Configuration:
     * - 5 submissions per hour (refilled gradually)
     * - Burst capacity of 3 (allows 3 quick submissions if tokens available)
     */
    private Bucket createContactBucket(String key) {
        // Main limit: 5 per hour, refilled 1 every 12 minutes
        Bandwidth hourlyLimit = Bandwidth.builder()
                .capacity(5)
                .refillIntervally(5, Duration.ofHours(1))
                .build();

        // Burst limit: max 3 in quick succession
        Bandwidth burstLimit = Bandwidth.builder()
                .capacity(3)
                .refillIntervally(1, Duration.ofMinutes(5))
                .build();

        return Bucket.builder()
                .addLimit(hourlyLimit)
                .addLimit(burstLimit)
                .build();
    }
}
