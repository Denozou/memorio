package com.memorio.backend.learning;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "learning_articles")
public class Article {

    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "slug", nullable = false, unique = true, length = 100)
    private String slug;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "subtitle", length = 300)
    private String subtitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "technique_category", nullable = false, length = 50)
    private TechniqueCategory techniqueCategory;

    @Column(name = "difficulty_level", nullable = false)
    private Integer difficultyLevel;

    @Column(name = "content_markdown", nullable = false)
    private String contentMarkdown;

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @Column(name = "cover_image_id")
    private UUID coverImageId;

    @Column(name = "author", length = 50)
    private String author;

    @Column(name = "estimated_read_minutes", nullable = false)
    private Integer estimatedReadMinutes;

    @Column (name = "required_skill_level")
    private Integer requiredSkillLevel;

    @Column(name = "sequence_in_category", nullable = false)
    private Integer sequenceInCategory;

    @Column(name = "is_intro_article", nullable = false)
    private Boolean isIntroArticle;

    @Column(name = "is_published", nullable = false)
    private Boolean isPublished;


    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false,updatable = false)
    private OffsetDateTime updatedAt;


    protected Article(){}

    public Article(UUID id, String slug, String title, String subtitle,
                   TechniqueCategory techniqueCategory, Integer difficultyLevel,
                   String contentMarkdown, String coverImageUrl,  UUID coverImageId, String author,
                   Integer estimatedReadMinutes, Integer requiredSkillLevel,
                   Integer sequenceInCategory, Boolean isIntroArticle,
                   Boolean isPublished,
                   OffsetDateTime createdAt, OffsetDateTime updatedAt){
        this.id = id;
        this.slug = slug;
        this.title = title;
        this.subtitle = subtitle;
        this.techniqueCategory = techniqueCategory;
        this.difficultyLevel = difficultyLevel;
        this.contentMarkdown = contentMarkdown;
        this.coverImageUrl = coverImageUrl;
        this.coverImageId = coverImageId;
        this.author = author;
        this.estimatedReadMinutes = estimatedReadMinutes;
        this.requiredSkillLevel = requiredSkillLevel;
        this.sequenceInCategory = sequenceInCategory;
        this.isIntroArticle = isIntroArticle;
        this.isPublished = isPublished;

        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Article(String slug, String title, String subtitle,
                   TechniqueCategory techniqueCategory, Integer difficultyLevel,
                   String contentMarkdown, String coverImageUrl, String author,
                   Integer estimatedReadMinutes, Integer requiredSkillLevel,
                   Integer sequenceInCategory, Boolean isIntroArticle,
                   Boolean isPublished){
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
        this.sequenceInCategory = sequenceInCategory;
        this.isIntroArticle = isIntroArticle;
        this.isPublished = isPublished;
    }
    public UUID getId(){return id;}
    public String getSlug(){return slug;}
    public String getTitle(){return title;}
    public String getSubtitle(){return subtitle;}
    public TechniqueCategory getTechniqueCategory(){return techniqueCategory;}
    public Integer getDifficultyLevel(){return difficultyLevel;}
    public String getContentMarkdown(){return  contentMarkdown;}
    public String getCoverImageUrl(){return coverImageUrl;}

    public UUID getCoverImageId() { return coverImageId; }

    public String getAuthor(){return author;}
    public Integer getEstimatedReadMinutes(){return estimatedReadMinutes;}
    public Integer getRequiredSkillLevel(){return requiredSkillLevel;}
    public Integer getSequenceInCategory(){return sequenceInCategory;}
    public Boolean getIsIntroArticle(){return isIntroArticle;}
    public Boolean getIsPublished(){ return isPublished;}
    public OffsetDateTime getCreatedAt(){return createdAt;}
    public OffsetDateTime getUpdatedAt(){return updatedAt;}
    public void setCoverImageId(UUID coverImageId) { this.coverImageId = coverImageId; }

}
