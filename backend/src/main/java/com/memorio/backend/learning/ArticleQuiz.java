package com.memorio.backend.learning;


import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;
@Entity
@Table(name = "article_quizzes")
public class ArticleQuiz {
    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "article_id", nullable = false, unique = true)
    private UUID articleId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "passing_score", nullable = false, updatable = false)
    private Integer passingScore;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    protected ArticleQuiz(){}

    public ArticleQuiz(UUID articleId, String title, Integer passingScore){
        this.articleId = articleId;
        this.title = title;
        this.passingScore = passingScore;
    }

    public UUID getId(){return id;}
    public UUID getArticleId(){return articleId;}
    public String getTitle(){return title;}
    public Integer getPassingScore(){return passingScore;}
    public OffsetDateTime getCreatedAt(){return createdAt;}

}
