package com.memorio.backend.admin.dto;
import com.memorio.backend.learning.TechniqueCategory;
import jakarta.validation.constraints.*;


public class CreateArticleRequest {
    @NotBlank(message = "slug is required")
    @Size(max = 100, message = "Slug must be max 100 characters long")
    private String slug;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be max 200 characters")
    private String title;

    @Size(max = 300, message = "Subtitle must be max 300 characters long")
    private String subtitle;

    @NotNull(message = "Technique category is required")
    private TechniqueCategory techniqueCategory;

    @NotNull(message = "Difficulty levell is requiered")
    @Min(value = 1, message = "Difficulty level must be at least 1")
    @Max(value = 5, message = "Difficulty level must be 5 at most")
    private  Integer difficultyLevel;

    @NotBlank(message = "Content is required")
    private String contentMarkdown;

    private String coverImageUrl;

    @Size(max = 100, message = "Author must be max 100 characters")
    private String author;

    @NotNull(message = "Estimated read time is required")
    @Min(value = 1, message = "estimated read time must be at least 1 minute")
    @Max(value = 120, message = "Estimated read time must be at most 120 minutes")
    private Integer estimatedReadMinutes;

    @Min(value = 1, message = "Required skill level must be at least 1")
    @Max(value =10, message = "Required skill level must be 10 at most")
    private Integer requiredSkillLevel;

    @NotNull(message = "Sequence in category is required")
    @Min(value = 1, message = "Sequence must be at least 1")
    private Integer sequenceInCategory;

    @NotNull(message = "Is intro article is required")
    private Boolean isIntroArticle;

    private Boolean isPublished;



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
    public Integer getSequenceInCategory() { return sequenceInCategory; }
    public Boolean getIsIntroArticle() { return isIntroArticle; }
    public Boolean getIsPublished() { return isPublished; }

    public void setSlug(String slug) { this.slug = slug; }
    public void setTitle(String title) { this.title = title; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }
    public void setTechniqueCategory(TechniqueCategory techniqueCategory) {
        this.techniqueCategory = techniqueCategory;
    }
    public void setDifficultyLevel(Integer difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }
    public void setContentMarkdown(String contentMarkdown) {
        this.contentMarkdown = contentMarkdown;
    }
    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }
    public void setAuthor(String author) { this.author = author; }
    public void setEstimatedReadMinutes(Integer estimatedReadMinutes) {
        this.estimatedReadMinutes = estimatedReadMinutes;
    }
    public void setRequiredSkillLevel(Integer requiredSkillLevel) {
        this.requiredSkillLevel = requiredSkillLevel;
    }
    public void setSequenceInCategory(Integer sequenceInCategory) {
        this.sequenceInCategory = sequenceInCategory;
    }
    public void setIsIntroArticle(Boolean isIntroArticle) {
        this.isIntroArticle = isIntroArticle;
    }
    public void setIsPublished(Boolean isPublished) {
        this.isPublished = isPublished;
    }

}
