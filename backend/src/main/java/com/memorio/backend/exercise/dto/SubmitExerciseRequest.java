package com.memorio.backend.exercise.dto;


import com.memorio.backend.exercise.ExerciseType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import java.util.UUID;
import java.util.List;

public class SubmitExerciseRequest {
    @NotNull(message = "sessionId is required")
    private UUID sessionId;
    @NotNull(message = "type is required")
    private ExerciseType type;
    @NotEmpty(message = "shownWords must not be empty")
    private List<String> shownWords;
    @NotNull(message = "answers are required")
    private List<String> answers;

    public UUID getSessionId(){return sessionId;}
    public void setSessionId(UUID sessionId){
        this.sessionId = sessionId;
    }
    public ExerciseType getType(){return type;}
    public void setType(ExerciseType type){
        this.type = type;
    }
    public List<String> getShownWords(){return shownWords;}
    public void setShownWords(List<String> shownWords){
        this.shownWords = shownWords;
    }

    public List<String> getAnswers(){return answers;}
    public void setAnswers(List<String> answers){
        this.answers = answers;
    }



}
