package com.memorio.backend.admin.dto;

import jakarta.validation.constraints.*;


public class CreateQuizRequest {

    @NotBlank(message = "Quiz title is required")
    @Size(max = 200, message = "Title must be max 200 characters")
    private String title;

    @NotNull(message = "Passing score is required")
    @Min(value = 0, message = "Passing score must be at least 0")
    @Max(value = 100, message = "Passing score must be at most 100")
    private Integer passingScore;

    public String getTitle(){return title;}
    public Integer getPassingScore(){return passingScore;}

    public void setTitle(String title){
        this.title = title;
    }
    public void setPassingScore(Integer passingScore){
        this.passingScore = passingScore;
    }
}
