package com.memorio.backend.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

/**
 * Custom cache error handler that provides graceful degradation when Redis is unavailable.
 * Instead of failing the request, it logs the error and falls back to the database.
 * 
 * This ensures the application remains functional even during Redis outages.
 * 
 * Production considerations:
 * - All cache errors are logged for monitoring/alerting
 * - Failed cache operations don't break the application
 * - Metrics can be added for cache failure rates
 */
public class CustomCacheErrorHandler implements CacheErrorHandler {

    private static final Logger log = LoggerFactory.getLogger(CustomCacheErrorHandler.class);

    @Override
    public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
        log.warn("Cache GET failed for cache='{}', key='{}'. Falling back to database. Error: {}",
                cache.getName(), key, exception.getMessage());
        // Don't rethrow - allow the method to execute and fetch from database
    }

    @Override
    public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
        log.warn("Cache PUT failed for cache='{}', key='{}'. Data saved to database only. Error: {}",
                cache.getName(), key, exception.getMessage());
        // Don't rethrow - the data is already in the database, just not cached
    }

    @Override
    public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
        log.warn("Cache EVICT failed for cache='{}', key='{}'. Error: {}",
                cache.getName(), key, exception.getMessage());
        // Don't rethrow - worst case is stale cache, which TTL will eventually clear
    }

    @Override
    public void handleCacheClearError(RuntimeException exception, Cache cache) {
        log.error("Cache CLEAR failed for cache='{}'. Manual cache clear may be needed. Error: {}",
                cache.getName(), exception.getMessage());
        // Don't rethrow - application can continue, but cache may have stale data
    }
}
