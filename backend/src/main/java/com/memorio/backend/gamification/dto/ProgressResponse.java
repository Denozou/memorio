package com.memorio.backend.gamification.dto;
import java.util.List;
public class ProgressResponse {
    private final long totalPoints;
    private final long totalAttempts;
    private final long totalCorrect;
    private final List<String> badges;

    public ProgressResponse(long totalPoints, long totalAttempts, long totalCorrect,
                            List<String> badges){
        this.totalPoints = totalPoints;
        this.totalAttempts = totalAttempts;
        this.totalCorrect = totalCorrect;
        this.badges = badges;
    }

    public long getTotalPoints(){return totalPoints;}
    public long getTotalAttempts(){return totalAttempts;}
    public long getTotalCorrect(){return totalCorrect;}
    public List<String> getBadges(){return badges;}
}
