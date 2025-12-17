package com.memorio.backend.learning;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_article_progress")
public class UserArticleProgress {
    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "article_id", nullable = false)
    private UUID articleId;

    @Column(name = "has_read", nullable = false)
    private Boolean hasRead;

    @Column(name = "first_read_at", nullable = false)
    private OffsetDateTime firstReadAt;

    @Column(name = "quiz_completed", nullable = false)
    private Boolean quizCompleted;

    @Column(name = "quiz_score")
    private Integer quizScore;

    @Column(name = "quiz_attempts", nullable = false)
    private Integer quizAttempts;

    @Column(name = "quiz_completed_at")
    private OffsetDateTime quizCompletedAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    protected UserArticleProgress(){}

    public UserArticleProgress(UUID userId, UUID articleId,
                               Boolean hasRead, OffsetDateTime firstReadAt,
                               Boolean quizCompleted, Integer quizScore,
                               Integer quizAttempts, OffsetDateTime quizCompletedAt){
        this.userId =userId;
        this.articleId = articleId;
        this.hasRead = hasRead;
        this.firstReadAt = firstReadAt;
        this.quizCompleted = quizCompleted;
        this.quizScore = quizScore;
        this.quizAttempts = quizAttempts;
        this.quizCompletedAt = quizCompletedAt;
    }


    public UUID getId(){return id;}
    public UUID getUserId(){return  userId;}
    public UUID getArticleId(){return articleId;}
    public Boolean getHasRead(){return hasRead;}

    public OffsetDateTime getFirstReadAt() {
        return firstReadAt;
    }
    public Boolean getQuizCompleted(){return quizCompleted;}
    public Integer getQuizScore(){return quizScore;}
    public Integer getQuizAttempts(){return quizAttempts;}
    public OffsetDateTime getQuizCompletedAt() {return quizCompletedAt;}

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Setters for mutable fields
    public void setHasRead(Boolean hasRead) {
        this.hasRead = hasRead;
    }

    public void setFirstReadAt(OffsetDateTime firstReadAt) {
        this.firstReadAt = firstReadAt;
    }

    public void setQuizCompleted(Boolean quizCompleted) {
        this.quizCompleted = quizCompleted;
    }

    public void setQuizScore(Integer quizScore) {
        this.quizScore = quizScore;
    }

    public void setQuizAttempts(Integer quizAttempts) {
        this.quizAttempts = quizAttempts;
    }

    public void setQuizCompletedAt(OffsetDateTime quizCompletedAt) {
        this.quizCompletedAt = quizCompletedAt;
    }
}
