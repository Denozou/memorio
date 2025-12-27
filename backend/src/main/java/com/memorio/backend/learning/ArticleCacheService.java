package com.memorio.backend.learning;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service for managing article and user progress cache eviction.
 * 
 * Cache eviction is critical for data consistency:
 * - Article cache is evicted when articles are created/updated/deleted
 * - User progress cache is evicted when user completes quizzes or marks articles as read
 * 
 * The cache TTL provides a safety net, but explicit eviction ensures immediate consistency.
 */
@Service
public class ArticleCacheService {

    /**
     * Evict all article cache entries.
     * Called when articles are created, updated, or deleted.
     */
    @CacheEvict(value = "articles", allEntries = true)
    public void evictAllArticleCache() {
        // Method body is empty - Spring AOP handles the cache eviction
    }

    /**
     * Evict a specific article from cache by slug.
     */
    @CacheEvict(value = "articles", key = "'slug:' + #slug")
    public void evictArticleBySlug(String slug) {
        // Method body is empty - Spring AOP handles the cache eviction
    }

    /**
     * Evict all articles in a category from cache.
     */
    @CacheEvict(value = "articles", key = "'category:' + #category")
    public void evictArticlesByCategory(TechniqueCategory category) {
        // Method body is empty - Spring AOP handles the cache eviction
    }

    /**
     * Evict all user progress cache entries for a specific user.
     * Called when user progress is updated (quiz completed, article read).
     */
    @CacheEvict(value = "userProgress", key = "'user:' + #userId + ':all'")
    public void evictUserProgressCache(UUID userId) {
        // Method body is empty - Spring AOP handles the cache eviction
    }

    /**
     * Evict specific user-article progress from cache.
     */
    @CacheEvict(value = "userProgress", key = "'user:' + #userId + ':article:' + #articleId")
    public void evictUserArticleProgressCache(UUID userId, UUID articleId) {
        // Method body is empty - Spring AOP handles the cache eviction
    }

    /**
     * Evict all progress cache for a user (both all-progress and specific entries).
     * Use this after quiz submission or article read to ensure fresh data.
     */
    @Caching(evict = {
        @CacheEvict(value = "userProgress", key = "'user:' + #userId + ':all'"),
        @CacheEvict(value = "userProgress", key = "'user:' + #userId + ':article:' + #articleId")
    })
    public void evictAllUserProgressForArticle(UUID userId, UUID articleId) {
        // Method body is empty - Spring AOP handles the cache eviction
    }
}
