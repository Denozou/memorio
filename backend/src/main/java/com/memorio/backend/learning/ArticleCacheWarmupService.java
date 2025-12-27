package com.memorio.backend.learning;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

/**
 * Service for warming up the article cache on application startup.
 * 
 * This pre-populates the Redis cache with frequently accessed data,
 * ensuring that the first user requests are served from cache rather than database.
 * 
 * Cache warming runs asynchronously to not block application startup.
 * 
 * Supported languages are pre-warmed to ensure fast response times
 * for users in all locales.
 */
@Service
@Profile("!test")
public class ArticleCacheWarmupService {

    private static final Logger log = LoggerFactory.getLogger(ArticleCacheWarmupService.class);

    private final ArticleRepository articleRepo;

    // Languages to pre-warm cache for
    private static final List<String> SUPPORTED_LANGUAGES = Arrays.asList("en", "pl");

    public ArticleCacheWarmupService(ArticleRepository articleRepo) {
        this.articleRepo = articleRepo;
    }

    /**
     * Warm up the cache after application is ready.
     * Runs asynchronously to not block startup.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Async
    public void warmUpCache() {
        log.info("Starting cache warmup for articles...");
        long startTime = System.currentTimeMillis();
        int totalCached = 0;

        try {
            for (String language : SUPPORTED_LANGUAGES) {
                totalCached += warmUpLanguageCache(language);
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("Cache warmup completed. Cached {} article queries in {}ms", totalCached, duration);

        } catch (Exception e) {
            log.warn("Cache warmup failed (non-critical): {}", e.getMessage());
            // Don't rethrow - cache warmup failure shouldn't prevent app from starting
        }
    }

    /**
     * Warm up cache for a specific language.
     * 
     * @param language Language code (e.g., "en", "pl")
     * @return Number of cache entries created
     */
    private int warmUpLanguageCache(String language) {
        int cached = 0;

        try {
            // Warm up main article list (most frequently accessed)
            List<Article> published = articleRepo.findAllPublishedByLanguage(language);
            cached++;
            log.debug("Cached {} published articles for language '{}'", published.size(), language);

            // Warm up intro articles (for anonymous users)
            List<Article> intro = articleRepo.findAllIntroArticlesByLanguage(language);
            cached++;
            log.debug("Cached {} intro articles for language '{}'", intro.size(), language);

            // Warm up category-specific queries
            for (TechniqueCategory category : TechniqueCategory.values()) {
                List<Article> categoryArticles = articleRepo.findByTechniqueCategoryAndLanguage(category, language);
                cached++;
                log.debug("Cached {} articles for category '{}' language '{}'", 
                         categoryArticles.size(), category, language);
            }

        } catch (Exception e) {
            log.warn("Failed to warm cache for language '{}': {}", language, e.getMessage());
        }

        return cached;
    }

    /**
     * Manually trigger cache warmup synchronously.
     * Called directly when manual warmup is needed (e.g., after bulk article updates).
     */
    public void manualWarmUp() {
        log.info("Manual cache warmup triggered");
        long startTime = System.currentTimeMillis();
        int totalCached = 0;

        try {
            for (String language : SUPPORTED_LANGUAGES) {
                totalCached += warmUpLanguageCache(language);
            }
            long duration = System.currentTimeMillis() - startTime;
            log.info("Manual cache warmup completed. Cached {} queries in {}ms", totalCached, duration);
        } catch (Exception e) {
            log.warn("Manual cache warmup failed: {}", e.getMessage());
        }
    }
}
