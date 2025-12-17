package com.memorio.backend.learning.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public class SubmitQuizRequest {
    @NotNull(message = "Quiz Id is required")
    private UUID quizId;

    @NotEmpty(message = "Answers cannot be empty")
    @Size(min = 1, max = 50, message = "Answers must be between 1 and 50")
    private List<UUID> selectedOptionIds;

    public UUID getQuizId(){return quizId;}
    public void setQuizId(UUID quizId){
        this.quizId = quizId;
    }

    public List<UUID> getSelectedOptionIds(){return selectedOptionIds;}
    public void setSelectedOptionIds(List<UUID> selectedOptionIds){
        this.selectedOptionIds = selectedOptionIds;
    }
}
