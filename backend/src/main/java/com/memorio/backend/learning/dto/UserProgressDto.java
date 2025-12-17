package com.memorio.backend.learning.dto;

import java.time.OffsetDateTime;

public class UserProgressDto {

    private final Long completedArticles;
    private final Double completionPercentage;
    private final OffsetDateTime lastActivity;

    public UserProgressDto(Long completedArticles, Double completionPercentage,
                           OffsetDateTime lastActivity){
        this.completedArticles = completedArticles;
        this.completionPercentage = completionPercentage;
        this.lastActivity = lastActivity;
    }
    public Long getCompletedArticles(){return completedArticles;}
    public Double getCompletionPercentage(){return completionPercentage;}
    public OffsetDateTime getLastActivity(){return lastActivity;}

}
