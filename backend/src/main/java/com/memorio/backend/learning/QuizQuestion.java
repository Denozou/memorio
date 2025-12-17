package com.memorio.backend.learning;


import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "quiz_questions")
public class QuizQuestion {
    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid")
    public UUID id;

    @Column(name = "quiz_id", nullable = false)
    public UUID quizId;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 30)
    private QuestionType questionType;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private OffsetDateTime createdAt;

    protected QuizQuestion(){}

    public QuizQuestion(UUID quizId, String questionText,
                        QuestionType questionType, Integer displayOrder,
                        String explanation){
        this.quizId = quizId;
        this.questionText = questionText;
        this.questionType = questionType;
        this.displayOrder = displayOrder;
        this.explanation = explanation;
    }



    public UUID getId(){return id;}
    public UUID getQuizId(){return quizId;}
    public String getQuestionText(){return questionText;}
    public QuestionType getQuestionType(){return questionType;}
    public Integer getDisplayOrder(){return displayOrder;}
    public String getExplanation(){ return explanation;}
    public OffsetDateTime getCreatedAt(){return createdAt;}
}
