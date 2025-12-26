package com.memorio.backend.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Validates Redis configuration on application startup.
 * Ensures Redis password is set in production environments.
 */
@Configuration
public class RedisConfigValidator {
    
    private static final Logger log = LoggerFactory.getLogger(RedisConfigValidator.class);
    
    @Value("${spring.data.redis.password:}")
    private String redisPassword;
    
    @Value("${security.cookie.secure:false}")
    private boolean isProduction;
    
    @EventListener(ApplicationReadyEvent.class)
    public void validateRedisConfig() {
        if (isProduction && (redisPassword == null || redisPassword.trim().isEmpty())) {
            log.error("SECURITY WARNING: Redis password is not set in production environment!");
            log.error("Set REDIS_PASSWORD environment variable to secure your Redis instance");
            throw new IllegalStateException(
                "Redis password must be configured in production. Set REDIS_PASSWORD environment variable."
            );
        }
        
        if (isProduction) {
            log.info("Redis security validation passed - password is configured");
        } else {
            log.warn("Running in development mode - Redis password validation skipped");
        }
    }
}
