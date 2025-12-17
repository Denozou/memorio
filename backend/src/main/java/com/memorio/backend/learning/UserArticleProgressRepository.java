package com.memorio.backend.learning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserArticleProgressRepository extends JpaRepository<UserArticleProgress, UUID>{

    Optional<UserArticleProgress> findByUserIdAndArticleId(UUID userId, UUID articleId);
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
