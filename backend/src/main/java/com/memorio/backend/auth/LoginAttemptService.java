package com.memorio.backend.auth;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

/**
 * Tracks failed login attempts and enforces account lockouts.
 * 
 * BEFORE (in-memory): Used ConcurrentHashMap - only worked on single server
 * AFTER (Redis): Shared across all backend instances - distributed lockout
 * 
 * How it works:
 * 1. Each failed login increments a counter in Redis
 * 2. After 5 failures, account is locked for 15 minutes
 * 3. Redis automatically deletes the data after lockout expires (TTL)
 * 4. Successful login clears the counter
 */
@Service
public class LoginAttemptService {
    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15;
    private static final String KEY_PREFIX = "login-attempt:";
    
    private final RedisTemplate<String, Object> redisTemplate;
    
    /**
     * Constructor injection - Spring automatically provides RedisTemplate
     * (configured in RedisConfig.java)
     */
    public LoginAttemptService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    /**
     * Called when login succeeds - clears any failed attempt data
     */
    public void loginSucceeded(String email) {
        String key = KEY_PREFIX + email;
        redisTemplate.delete(key);  // Remove from Redis
    }
    
    /**
     * Called when login fails - increments counter and locks if needed
     */
    public void loginFailed(String email) {
        String key = KEY_PREFIX + email;
        LoginAttempt attempt = getAttempt(email);
        
        if (attempt == null) {
            attempt = new LoginAttempt();
        }
        
        attempt.incrementAttempts();
        
        // Lock account after MAX_ATTEMPTS failures
        if (attempt.getAttempts() >= MAX_ATTEMPTS) {
            attempt.setLockedUntil(LocalDateTime.now().plusMinutes(LOCKOUT_DURATION_MINUTES));
        }
        
        // Store in Redis with automatic expiration (TTL)
        // TTL = lockout duration + 5 minute buffer
        redisTemplate.opsForValue().set(
            key, 
            attempt, 
            LOCKOUT_DURATION_MINUTES + 5,  // Expires after 20 minutes
            TimeUnit.MINUTES
        );
    }
    
    /**
     * Check if an email is currently locked out
     * @return true if blocked, false if allowed to login
     */
    public boolean isBlocked(String email) {
        LoginAttempt attempt = getAttempt(email);
        
        if (attempt == null) {
            return false;  // No failed attempts = not blocked
        }
        
        if (attempt.getLockedUntil() != null) {
            if (LocalDateTime.now().isBefore(attempt.getLockedUntil())) {
                return true;  // Still locked
            } else {
                // Lock expired, remove from Redis
                redisTemplate.delete(KEY_PREFIX + email);
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * Helper method to retrieve attempt data from Redis
     */
    private LoginAttempt getAttempt(String email) {
        String key = KEY_PREFIX + email;
        Object obj = redisTemplate.opsForValue().get(key);
        return obj != null ? (LoginAttempt) obj : null;
    }
    
    /**
     * Data class to store login attempt information.
     * MUST be public and static for Redis serialization to work.
     * 
     * Redis converts this to JSON:
     * {"attempts": 3, "lockedUntil": "2025-12-11T15:30:00"}
     */
    public static class LoginAttempt {
        private int attempts = 0;
        private LocalDateTime lockedUntil;
        
        // Default constructor required for deserialization
        public LoginAttempt() {}
        
        public int getAttempts() {
            return attempts;
        }
        
        public void incrementAttempts() {
            attempts++;
        }
        
        public LocalDateTime getLockedUntil() {
            return lockedUntil;
        }
        
        public void setLockedUntil(LocalDateTime lockedUntil) {
            this.lockedUntil = lockedUntil;
        }
        
        // Setters needed for deserialization
        public void setAttempts(int attempts) {
            this.attempts = attempts;
        }
    }
}