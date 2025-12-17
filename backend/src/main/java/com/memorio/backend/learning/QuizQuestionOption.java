package com.memorio.backend.learning;


import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;
import java.util.UUID;
@Entity
@Table(name = "quiz_question_options")
public class QuizQuestionOption {
    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "question_id", nullable = false)
    private UUID questionId;

    @Column(name = "option_text", nullable = false, columnDefinition = "TEXT")
    private String optionText;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    protected QuizQuestionOption(){}

    public QuizQuestionOption(UUID questionId, String optionText,
                              Boolean isCorrect, Integer displayOrder){
        this.questionId = questionId;
        this.optionText = optionText;
        this.isCorrect = isCorrect;
        this.displayOrder = displayOrder;
    }

    public UUID getId(){return id;}
    public UUID getQuestionId(){return questionId;}
    public String getOptionText(){return optionText;}
    public Boolean getIsCorrect(){ return isCorrect;}
    public Integer getDisplayOrder(){return displayOrder;}

}
