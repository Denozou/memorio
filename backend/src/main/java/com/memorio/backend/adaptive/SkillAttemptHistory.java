package com.memorio.backend.adaptive;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "skill_attempt_history")
public class SkillAttemptHistory {
    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "skill_mastery_id")
    private UUID skillMasteryId;

    @Column(name = "exercise_session_id")
    private UUID exerciseSessionId;

    @Column(name = "skill_type", nullable = false, length = 50)
    private String skillType;

    @Column(name = "difficulty_level", nullable = false)
    private int difficultyLevel;

    @Column(name = "was_correct", nullable = false)
    private boolean wasCorrect;

    @Column(name = "response_time_ms")
    private Integer responseTimeMs;

    /// Context
    @Column(name = "time_since_last_practice_hours")
    private Double timeSinceLastPracticeHours;

    @Column(name="user_skill_level_at_time")
    private Integer userSkillLevelAtTime;

    /// BKT state snapshots
    @Column(name = "probability_known_before")
    private Double probabilityKnownBefore;

    @Column(name = "probability_known_after")
    private Double probabilityKnownAfter;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected SkillAttemptHistory(){}

    public SkillAttemptHistory(UUID userId, UUID skillMasteryId, UUID exerciseSessionId,
                               String skillType, int difficultyLevel, boolean wasCorrect){
        this.userId = userId;
        this.skillMasteryId = skillMasteryId;
        this.exerciseSessionId = exerciseSessionId;
        this.skillType = skillType;
        this.difficultyLevel = difficultyLevel;
        this.wasCorrect = wasCorrect;
    }
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getSkillMasteryId() { return skillMasteryId; }
    public UUID getExerciseSessionId() { return exerciseSessionId; }
    public String getSkillType() { return skillType; }
    public int getDifficultyLevel() { return difficultyLevel; }
    public boolean isWasCorrect() { return wasCorrect; }
    public Integer getResponseTimeMs() { return responseTimeMs; }
    public void setResponseTimeMs(Integer responseTimeMs) { this.responseTimeMs = responseTimeMs; }
    public Double getTimeSinceLastPracticeHours() { return timeSinceLastPracticeHours; }
    public void setTimeSinceLastPracticeHours(Double timeSinceLastPracticeHours) {
        this.timeSinceLastPracticeHours = timeSinceLastPracticeHours;
    }
    public Integer getUserSkillLevelAtTime() { return userSkillLevelAtTime; }
    public void setUserSkillLevelAtTime(Integer userSkillLevelAtTime) {
        this.userSkillLevelAtTime = userSkillLevelAtTime;
    }
    public Double getProbabilityKnownBefore() { return probabilityKnownBefore; }
    public void setProbabilityKnownBefore(Double probabilityKnownBefore) {
        this.probabilityKnownBefore = probabilityKnownBefore;
    }
    public Double getProbabilityKnownAfter() { return probabilityKnownAfter; }
    public void setProbabilityKnownAfter(Double probabilityKnownAfter) {
        this.probabilityKnownAfter = probabilityKnownAfter;
    }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
