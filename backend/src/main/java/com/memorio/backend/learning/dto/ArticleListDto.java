package com.memorio.backend.learning.dto;

import com.memorio.backend.learning.Article;
import com.memorio.backend.learning.TechniqueCategory;
import com.memorio.backend.learning.UserArticleProgress;

import java.util.UUID;

public class ArticleListDto {

    private final UUID id;
    private final String slug;
    private final String title;
    private final String subtitle;
    private final TechniqueCategory techniqueCategory;
    private final Integer difficultyLevel;
    private final Integer estimatedReadMinutes;
    private final Integer requiredSkillLevel;
    private final String coverImageUrl;
    private final String author;
    private final String contentMarkdown;
    private final Boolean isPublished;
    private final Integer sequenceInCategory;
    private final Boolean isIntroArticle;
    private final String language;
    private final Boolean hasRead;
    private final Boolean quizCompleted;
    private final Integer quizScore;

    public ArticleListDto(UUID id, String slug, String title, String subtitle,
                          TechniqueCategory techniqueCategory, Integer difficultyLevel,
                          Integer estimatedReadMinutes, Integer requiredSkillLevel,
                          String coverImageUrl,
                          String author, String contentMarkdown, Boolean isPublished,
                          Integer sequenceInCategory, Boolean isIntroArticle, String language,
                          Boolean hasRead, Boolean quizCompleted, Integer quizScore) {
        this.id = id;
        this.slug = slug;
        this.title = title;
        this.subtitle = subtitle;
        this.techniqueCategory = techniqueCategory;
        this.difficultyLevel = difficultyLevel;
        this.estimatedReadMinutes = estimatedReadMinutes;
        this.requiredSkillLevel = requiredSkillLevel;
        this.coverImageUrl = coverImageUrl;
        this.author = author;
        this.contentMarkdown = contentMarkdown;
        this.isPublished = isPublished;
        this.sequenceInCategory = sequenceInCategory;
        this.isIntroArticle = isIntroArticle;
        this.language = language;
        this.hasRead = hasRead;
        this.quizCompleted = quizCompleted;
        this.quizScore = quizScore;
    }
    public static ArticleListDto fromArticle(Article article){
        String coverImageUrl = article.getCoverImageId() != null
                ? "/api/learning/images/" + article.getCoverImageId()
                : null;
        return new ArticleListDto(
                article.getId(),
                article.getSlug(),
                article.getTitle(),
                article.getSubtitle(),
                article.getTechniqueCategory(),
                article.getDifficultyLevel(),
                article.getEstimatedReadMinutes(),
                article.getRequiredSkillLevel(),
                coverImageUrl,
                article.getAuthor(),
                article.getContentMarkdown(),
                article.getIsPublished(),
                article.getSequenceInCategory(),
                article.getIsIntroArticle(),
                article.getLanguage(),
                null,
                null,
                null
        );
    }
    public static ArticleListDto fromArticleWithProgress(Article article, UserArticleProgress progress){
        // Generate URL from coverImageId, same as fromArticle()
        String coverImageUrl = article.getCoverImageId() != null
                ? "/api/learning/images/" + article.getCoverImageId()
                : article.getCoverImageUrl(); // Fallback to URL field if no ID
        return new ArticleListDto(
                article.getId(),
                article.getSlug(),
                article.getTitle(),
                article.getSubtitle(),
                article.getTechniqueCategory(),
                article.getDifficultyLevel(),
                article.getEstimatedReadMinutes(),
                article.getRequiredSkillLevel(),
                coverImageUrl,
                article.getAuthor(),
                article.getContentMarkdown(),
                article.getIsPublished(),
                article.getSequenceInCategory(),
                article.getIsIntroArticle(),
                article.getLanguage(),
                progress != null ? progress.getHasRead() : false,
                progress != null ? progress.getQuizCompleted() : false,
                progress != null ? progress.getQuizScore() : null
        );
    }



    public UUID getId() { return id; }
    public String getSlug() { return slug; }
    public String getTitle() { return title; }
    public String getSubtitle() { return subtitle; }
    public TechniqueCategory getTechniqueCategory() { return techniqueCategory; }
    public Integer getDifficultyLevel() { return difficultyLevel; }
    public Integer getEstimatedReadMinutes() { return estimatedReadMinutes; }
    public Integer getRequiredSkillLevel() { return requiredSkillLevel; }
    public String getCoverImageUrl() { return coverImageUrl; }
    public String getAuthor() { return author; }
    public String getContentMarkdown() { return contentMarkdown; }
    public Boolean getIsPublished() { return isPublished; }
    public Integer getSequenceInCategory() { return sequenceInCategory; }
    public Boolean getIsIntroArticle() { return isIntroArticle; }
    public String getLanguage() { return language; }
    public Boolean getHasRead() { return hasRead; }
    public Boolean getQuizCompleted() { return quizCompleted; }
    public Integer getQuizScore() { return quizScore; }



}
