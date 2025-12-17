package com.memorio.backend.adaptive.dto;
import java.time.OffsetDateTime;
import java.util.UUID;

public class SkillMasteryDTO {
    private UUID id;
    private final String skillType;
    private final String conceptId;
    private final double probabilityKnown;
    private final int totalAttempts;
    private final int correctAttempts;
    private final double accuracyRate;
    private final boolean isMastered;
    private final boolean needsReview;
    private final OffsetDateTime nextReviewAt;
    private final OffsetDateTime lastAttemptAt;
    private final double reviewIntervalDays;
    private final double easeFactor;

    public SkillMasteryDTO(UUID id, String skillType, String conceptId,
                           double probabilityKnown, int totalAttempts,
                           int correctAttempts, double accuracyRate,
                           boolean isMastered, boolean needsReview,
                           OffsetDateTime nextReviewAt, OffsetDateTime lastAttemptAt,
                           double reviewIntervalDays, double easeFactor) {
        this.id = id;
        this.skillType = skillType;
        this.conceptId = conceptId;
        this.probabilityKnown = probabilityKnown;
        this.totalAttempts = totalAttempts;
        this.correctAttempts = correctAttempts;
        this.accuracyRate = accuracyRate;
        this.isMastered = isMastered;
        this.needsReview = needsReview;
        this.nextReviewAt = nextReviewAt;
        this.lastAttemptAt = lastAttemptAt;
        this.reviewIntervalDays = reviewIntervalDays;
        this.easeFactor = easeFactor;
    }

    public UUID getId() {
        return id;
    }

    public String getSkillType() {
        return skillType;
    }

    public String getConceptId() {
        return conceptId;
    }

    public double getProbabilityKnown() {
        return probabilityKnown;
    }

    public int getTotalAttempts() {
        return totalAttempts;
    }

    public int getCorrectAttempts() {
        return correctAttempts;
    }

    public double getAccuracyRate() {
        return accuracyRate;
    }

    public boolean isMastered() {
        return isMastered;
    }

    public boolean isNeedsReview() {
        return needsReview;
    }

    public OffsetDateTime getNextReviewAt() {
        return nextReviewAt;
    }

    public OffsetDateTime getLastAttemptAt() {
        return lastAttemptAt;
    }

    public double getReviewIntervalDays() {
        return reviewIntervalDays;
    }

    public double getEaseFactor() {
        return easeFactor;
    }
}