package com.memorio.backend.admin.dto;


import com.memorio.backend.learning.QuestionType;
import jakarta.validation.constraints.*;
public class CreateQuestionRequest {

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull(message = "Question tyoe is required")
    private QuestionType questionType;

    private String explanation; //Optional

    @NotNull(message = "Display order is required")
    @Min(value = 0, message = "Display order must be at least 0")
    private Integer displayOrder;


    public String getQuestionText() {return questionText; }
    public QuestionType getQuestionType() {return questionType;}
    public String getExplanation() { return explanation; }


    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }
    public void setQuestionType(QuestionType questionType) {
        this.questionType = questionType;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
