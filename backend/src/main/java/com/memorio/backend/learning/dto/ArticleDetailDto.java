package com.memorio.backend.learning.dto;

import com.memorio.backend.learning.Article;
import com.memorio.backend.learning.TechniqueCategory;
import com.memorio.backend.learning.UserArticleProgress;

import java.time.OffsetDateTime;
import java.util.UUID;

public class ArticleDetailDto {
    private final UUID id;
    private final String slug;
    private final String title;
    private final String subtitle;
    private final TechniqueCategory techniqueCategory;
    private final Integer difficultyLevel;
    private final String contentMarkdown;
    private final String coverImageUrl;
    private final String author;
    private final Integer estimatedReadMinutes;
    private final Integer requiredSkillLevel;
    private final OffsetDateTime createdAt;
    private final Boolean hasRead;
    private final Boolean quizCompleted;
    private final Integer quizScore;
    private final Integer quizAttempts;

    public ArticleDetailDto(UUID id, String slug, String title, String subtitle,
                            TechniqueCategory techniqueCategory, Integer difficultyLevel,
                            String contentMarkdown, String coverImageUrl, String author,
                            Integer estimatedReadMinutes, Integer requiredSkillLevel,
                            OffsetDateTime createdAt, Boolean hasRead, Boolean quizCompleted,
                            Integer quizScore, Integer quizAttempts) {
        this.id = id;
        this.slug = slug;
        this.title = title;
        this.subtitle = subtitle;
        this.techniqueCategory = techniqueCategory;
        this.difficultyLevel = difficultyLevel;
        this.contentMarkdown = contentMarkdown;
        this.coverImageUrl = coverImageUrl;
        this.author = author;
        this.estimatedReadMinutes = estimatedReadMinutes;
        this.requiredSkillLevel = requiredSkillLevel;
        this.createdAt = createdAt;
        this.hasRead = hasRead;
        this.quizCompleted = quizCompleted;
        this.quizScore = quizScore;
        this.quizAttempts = quizAttempts;
    }


    public static ArticleDetailDto fromArticle(Article article){
        String coverImageUrl = article.getCoverImageId() != null
                ? "/api/learning/images/" + article.getCoverImageId()
                : article.getCoverImageUrl();  // Fallback to old URL field


        return new ArticleDetailDto(
                article.getId(),
                article.getSlug(),
                article.getTitle(),
                article.getSubtitle(),
                article.getTechniqueCategory(),
                article.getDifficultyLevel(),
                article.getContentMarkdown(),
                coverImageUrl,
                article.getAuthor(),
                article.getEstimatedReadMinutes(),
                article.getRequiredSkillLevel(),
                article.getCreatedAt(),
                null,
                null,
                null,
                null
        );
    }

    public static ArticleDetailDto fromArticleWithProgress(Article article, UserArticleProgress progress) {
        String coverImageUrl = article.getCoverImageId() != null
                ? "/api/learning/images/" + article.getCoverImageId()
                : article.getCoverImageUrl();
        
        return new ArticleDetailDto(
                article.getId(), article.getSlug(), article.getTitle(),
                article.getSubtitle(), article.getTechniqueCategory(),
                article.getDifficultyLevel(), article.getContentMarkdown(),
                coverImageUrl, article.getAuthor(),
                article.getEstimatedReadMinutes(), article.getRequiredSkillLevel(),
                article.getCreatedAt(),
                progress != null ? progress.getHasRead() : false,
                progress != null ? progress.getQuizCompleted() : false,
                progress != null ? progress.getQuizScore() : null,
                progress != null ? progress.getQuizAttempts() : 0
        );
    }
    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public String getTitle() { return title; }
    public String getSubtitle() { return subtitle; }
    public TechniqueCategory getTechniqueCategory() { return techniqueCategory; }
    public Integer getDifficultyLevel() { return difficultyLevel; }
    public String getContentMarkdown() { return contentMarkdown; }
    public String getCoverImageUrl() { return coverImageUrl; }
    public String getAuthor() { return author; }
    public Integer getEstimatedReadMinutes() { return estimatedReadMinutes; }
    public Integer getRequiredSkillLevel() { return requiredSkillLevel; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public Boolean getHasRead() { return hasRead; }
    public Boolean getQuizCompleted() { return quizCompleted; }
    public Integer getQuizScore() { return quizScore; }
    public Integer getQuizAttempts() { return quizAttempts; }

}
