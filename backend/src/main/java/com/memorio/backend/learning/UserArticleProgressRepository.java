package com.memorio.backend.learning;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for user article progress tracking.
 * Includes caching for frequently accessed queries.
 * Cache is invalidated when progress is updated (see LearningService).
 */
public interface UserArticleProgressRepository extends JpaRepository<UserArticleProgress, UUID> {

    /**
     * Find progress for a specific user and article.
     * Cached with short TTL since progress can change frequently.
     */
    @Cacheable(value = "userProgress", key = "'user:' + #userId + ':article:' + #articleId", 
               unless = "#result == null || (#result instanceof T(java.util.Optional) && !#result.isPresent())")
    Optional<UserArticleProgress> findByUserIdAndArticleId(UUID userId, UUID articleId);

    /**
     * Find all progress records for a user.
     * Cached to speed up progress overview pages.
     */
    @Cacheable(value = "userProgress", key = "'user:' + #userId + ':all'")
    List<UserArticleProgress> findByUserId(UUID userId);
    @Query("SELECT COUNT(p) FROM UserArticleProgress p " +
            "WHERE p.userId = :userId AND p.quizCompleted = true")
    Long countCompletedArticles(@Param("userId") UUID userId);

    @Query("SELECT (COUNT(p) * 100.0 / (SELECT COUNT(a) FROM Article a WHERE a.isPublished = true)) " +
            "FROM UserArticleProgress p WHERE p.userId = :userId AND p.quizCompleted = true")
    Double getCompletionPercentage(@Param("userId") UUID userId);

    @Query("SELECT p FROM UserArticleProgress p " +
            "WHERE p.userId = :userId AND p.quizCompleted = true")
    List<UserArticleProgress> findCompletedByUserId(@Param("userId") UUID userId);
}
