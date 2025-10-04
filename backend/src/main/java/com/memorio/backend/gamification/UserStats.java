package com.memorio.backend.gamification;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "user_stats")
public class UserStats {
    @Id
    @Column(name = "user_id")
    private UUID userId;
    @Column(name = "total_points", nullable = false)
    private long totalPoints;
    @Column(name = "total_attempts", nullable = false)
    private long totalAttempts;
    @Column(name = "total_correct", nullable = false)
    private long totalCorrect;

    protected UserStats(){}

    public UserStats(UUID userId){
        this.userId = userId;
    }
    public UUID getUserId(){return userId;}
    public long getTotalPoints(){return totalPoints;}
    public long getTotalAttempts(){return totalAttempts;}
    public long getTotalCorrect(){return totalCorrect;}

    public void addAttempt(int correct, int points){
        this.totalAttempts+=1;
        this.totalCorrect += correct;
        this.totalPoints += points;
    }
}
