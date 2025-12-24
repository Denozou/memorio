package com.memorio.backend.learning;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for accessing Article entities.
 * Includes caching for frequently accessed queries.
 * Cache configuration is in RedisConfig (30-minute TTL).
 */
public interface ArticleRepository extends JpaRepository<Article, UUID> {

    /**
     * Find article by slug (URL-friendly identifier).
     * Cached for 30 minutes (configured in RedisConfig).
     * Cache key: "articles::slug:intro" (for slug="intro")
     */
    @Cacheable(value = "articles", key = "'slug:' + #slug", unless = "#result == null || !#result.isPresent()")
    Optional<Article> findBySlug(String slug);

    /**
     * Find all published articles in a specific category and language.
     * This replaces the old findByTechniqueCategoryAndIsPublishedTrue.
     * Cache key: "articles::category:MEMORY_PALACE:lang:en"
     */
    @Cacheable(value = "articles", key = "'category:' + #category + ':lang:' + #language")
    @Query("SELECT a FROM Article a WHERE a.techniqueCategory = :category " +
            "AND a.isPublished = true AND a.language = :language " +
            "ORDER BY a.sequenceInCategory")
    List<Article> findByTechniqueCategoryAndLanguage(
            @Param("category") TechniqueCategory category,
            @Param("language") String language
    );

    /**
     * Find all published articles in a specific language, ordered by category and sequence.
     * This is called frequently (homepage, article list).
     * Cache key: "articles::published:lang:en"
     */
    @Cacheable(value = "articles", key = "'published:lang:' + #language")
    @Query("SELECT a FROM Article a WHERE a.isPublished = true AND a.language = :language " +
            "ORDER BY a.techniqueCategory, a.sequenceInCategory")
    List<Article> findAllPublishedByLanguage(@Param("language") String language);

    /**
     * Find all intro articles (free content) in a specific language.
     * Cache key: "articles::intro:lang:en"
     */
    @Cacheable(value = "articles", key = "'intro:lang:' + #language")
    @Query("SELECT a FROM Article a WHERE a.isPublished = true " +
            "AND a.isIntroArticle = true AND a.language = :language " +
            "ORDER BY a.techniqueCategory, a.sequenceInCategory")
    List<Article> findAllIntroArticlesByLanguage(@Param("language") String language);

    /**
     * Find article by category, sequence number, and language.
     * Used for determining article prerequisites and unlock logic.
     * Cache key: "articles::cat:MEMORY_PALACE:seq:1:lang:en"
     */
    @Cacheable(value = "articles", key = "'cat:' + #category + ':seq:' + #sequence + ':lang:' + #language", unless = "#result == null || !#result.isPresent()")
    @Query("SELECT a FROM Article a WHERE a.techniqueCategory = :category " +
            "AND a.sequenceInCategory = :sequence AND a.isPublished = true " +
            "AND a.language = :language")
    Optional<Article> findByCategorySequenceAndLanguage(
            @Param("category") TechniqueCategory category,
            @Param("sequence") Integer sequence,
            @Param("language") String language
    );

    /**
     * Find the intro article for a specific category and language.
     * Cache key: "articles::intro:cat:MEMORY_PALACE:lang:en"
     */
    @Cacheable(value = "articles", key = "'intro:cat:' + #category + ':lang:' + #language", unless = "#result == null || !#result.isPresent()")
    @Query("SELECT a FROM Article a WHERE a.techniqueCategory = :category " +
            "AND a.isIntroArticle = true AND a.language = :language")
    Optional<Article> findByTechniqueCategoryAndIsIntroArticleTrueAndLanguage(
            @Param("category") TechniqueCategory category,
            @Param("language") String language
    );

    // ===== ADMIN-ONLY METHODS (no language filter) =====

    /**
     * Find all articles (published and unpublished), all languages.
     * Used by admins to manage content.
     * No caching since admins need real-time data.
     */
    List<Article> findAllByOrderByTechniqueCategoryAscSequenceInCategoryAsc();

    /**
     * DEPRECATED: Use findByTechniqueCategoryAndLanguage instead.
     * Kept for backward compatibility but will return mixed languages.
     */
    @Deprecated
    List<Article> findByTechniqueCategoryAndIsPublishedTrue(TechniqueCategory category);

    /**
     * DEPRECATED: Use findAllPublishedByLanguage instead.
     * Kept for backward compatibility but will return mixed languages.
     */
    @Deprecated
    @Query("SELECT a FROM Article a WHERE a.isPublished = true " +
            "ORDER BY a.techniqueCategory, a.sequenceInCategory")
    List<Article> findAllPublishedOrderedByCategory();

    /**
     * DEPRECATED: Use findAllIntroArticlesByLanguage instead.
     */
    @Deprecated
    @Query("SELECT a FROM Article a WHERE a.isPublished = true AND a.isIntroArticle = true " +
            "ORDER BY a.techniqueCategory, a.sequenceInCategory")
    List<Article> findAllIntroArticles();

    /**
     * DEPRECATED: Use findByCategorySequenceAndLanguage instead.
     */
    @Deprecated
    @Query("SELECT a FROM Article a WHERE a.techniqueCategory = :category " +
            "AND a.sequenceInCategory = :sequence AND a.isPublished = true")
    Optional<Article> findByCategoryAndSequence(
            @Param("category") TechniqueCategory category,
            @Param("sequence") Integer sequence
    );

    /**
     * DEPRECATED: Use findByTechniqueCategoryAndIsIntroArticleTrueAndLanguage instead.
     */
    @Deprecated
    Optional<Article> findByTechniqueCategoryAndIsIntroArticleTrue(TechniqueCategory category);
}