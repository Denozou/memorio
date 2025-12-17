package com.memorio.backend.learning;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface ArticleRepository extends JpaRepository<Article, UUID>{
    
    /**
     * Find article by slug (URL-friendly identifier).
     * Cached for 30 minutes (configured in RedisConfig).
     * Cache key: "articles::slug:intro" (for slug="intro")
     */
    @Cacheable(value = "articles", key = "'slug:' + #slug")
    Optional<Article> findBySlug(String slug);

    /**
     * Find all published articles in a category.
     * Cache key: "articles::category:MEMORY_PALACE"
     */
    @Cacheable(value = "articles", key = "'category:' + #category")
    List<Article> findByTechniqueCategoryAndIsPublishedTrue(TechniqueCategory category);

    /**
     * Find all published articles, ordered by category and sequence.
     * This is called frequently (homepage, article list).
     * Cache key: "articles::published"
     */
    @Cacheable(value = "articles", key = "'published'")
    @Query("SELECT a FROM Article a WHERE a.isPublished = true " +
            "ORDER BY a.techniqueCategory, a.sequenceInCategory")
    List<Article> findAllPublishedOrderedByCategory();
    
    /**
     * Find all intro articles (free content).
     * Cache key: "articles::intro"
     */
    @Cacheable(value = "articles", key = "'intro'")
    @Query("SELECT a FROM Article a WHERE a.isPublished = true AND a.isIntroArticle = true " +
            "ORDER BY a.techniqueCategory, a.sequenceInCategory")
    List<Article> findAllIntroArticles();

    /**
     * Find article by category and sequence number.
     * Cache key: "articles::cat:MEMORY_PALACE:seq:1"
     */
    @Cacheable(value = "articles", key = "'cat:' + #category + ':seq:' + #sequence")
    @Query("SELECT a FROM Article a WHERE a.techniqueCategory = :category " +
            "AND a.sequenceInCategory = :sequence AND a.isPublished = true")
    Optional<Article> findByCategoryAndSequence(@Param("category") TechniqueCategory category,
                                                @Param("sequence") Integer sequence);

    List<Article> findAllByOrderByTechniqueCategoryAscSequenceInCategoryAsc();

    Optional<Article> findByTechniqueCategoryAndIsIntroArticleTrue(TechniqueCategory category);

}
