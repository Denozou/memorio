package com.memorio.backend.exercise.dto;
import com.memorio.backend.exercise.ExerciseType;
import jakarta.validation.constraints.NotNull;
public class StartExerciseRequest {
    @NotNull(message = "type is required")
    private ExerciseType type;

    public ExerciseType getType(){
        return type;
    }
    public void setType(ExerciseType type){
        this.type = type;
    }
}
