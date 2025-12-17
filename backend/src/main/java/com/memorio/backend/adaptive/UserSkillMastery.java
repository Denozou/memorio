package com.memorio.backend.adaptive;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;
@Entity
@Table(name ="user_skill_mastery")
public class UserSkillMastery {

    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "skill_type", nullable = false, length = 50)
    private String skillType;

    @Column(name = "concept_id", length = 100)
    private String conceptId;


    /// BKT params
    @Column(name = "probability_known", nullable = false)
    private double probabilityKnown = 0.3;

    @Column(name = "probability_learned", nullable = false)
    private double probabilityLearned = 0.1;

    @Column(name = "probability_slip", nullable = false)
    private double probabilitySlip = 0.1;

    @Column(name = "probability_guess", nullable = false)
    private double probabilityGuess = 0.25;

    /// Performance tracking
    @Column(name = "total_attempts", nullable = false)
    private int totalAttempts = 0;

    @Column(name = "correct_attempts", nullable = false)
    private int correctAttempts = 0;

    @Column(name = "last_attempt_at")
    private OffsetDateTime lastAttemptAt;

    /// spaced repetition SM-2 algo
    @Column(name = "next_review_at")
    private OffsetDateTime nextReviewAt;

    @Column(name = "review_interval_days")
    public double reviewIntervalDays = 1.0;

    @Column(name = "ease_factor")
    private double easeFactor = 2.5; //range 1.3-2.5, higher = easier to remember, longer intervals

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    protected UserSkillMastery(){}
    public UserSkillMastery(UUID userId, String skillType, String conceptId){
        this.userId=userId;
        this.skillType = skillType;
        this.conceptId = conceptId;
    }

    public void updateKnowledgeState(boolean wasCorrect){
        double pKnown = this.probabilityKnown;
        double pSlip = this.probabilitySlip;
        double pGuess = this.probabilityGuess;
        double pLearn = this.probabilityLearned;

        double pKnownGivenEvidence;

        if(wasCorrect){
            double pCorrectGivenKnown = 1.0 - pSlip;
            double pCorrectGivenUnknown = pGuess;
            double pCorrect = pKnown * pCorrectGivenKnown + (1-pKnown) * pCorrectGivenUnknown;

            pKnownGivenEvidence = (pKnown * pCorrectGivenKnown) /pCorrect;
        }else {
            double pIncorrectGivenKnown = pSlip;
            double pIncorrectGivenUnknown = 1.0 - pGuess;
            double pIncorrect = pKnown * pIncorrectGivenKnown + (1-pKnown) * pIncorrectGivenUnknown;

            pKnownGivenEvidence = (pKnown * pIncorrectGivenKnown) / pIncorrect;
        }

        this.probabilityKnown = pKnownGivenEvidence + (1 - pKnownGivenEvidence) * pLearn;
        this.probabilityKnown = Math.max(0.0, Math.min(1.0, this.probabilityKnown));

        this.totalAttempts++;
        if(wasCorrect) {
            this.correctAttempts++;
        }
        this.lastAttemptAt = OffsetDateTime.now();
    }

    public void updateSpaceRepetition(int quality){
        if(quality < 0 || quality > 5){
            throw new IllegalArgumentException("Quality must be between 0 and 5");
        }

        double newEaseFactor = this.easeFactor + (0.1 - (5-quality) * (0.08 + (5-quality) * 0.02));
        this.easeFactor = Math.max(1.3, newEaseFactor);

        if(quality < 3){
            this.reviewIntervalDays = 1.0;
        }else{
            if(this.totalAttempts == 1){
                this.reviewIntervalDays = 1.0;
            } else if (this.totalAttempts ==2) {
                this.reviewIntervalDays = 6.0;
            }else{
                this.reviewIntervalDays = this.reviewIntervalDays * this.easeFactor;
            }
        }

        this.nextReviewAt = OffsetDateTime.now().plusDays((long) Math.ceil(this.reviewIntervalDays));
    }

    public boolean isMastered(){
        return this.probabilityKnown >= 0.95;
    }

    public boolean needsReview(){
        if(this.nextReviewAt == null){
            return true;
        }
        return OffsetDateTime.now().isAfter(this.nextReviewAt);
    }

    public double getAccuracyRate(){
        if(this.totalAttempts == 0){
            return 0;
        }
        return (double) this.correctAttempts / this.totalAttempts;
    }
    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getSkillType() { return skillType; }
    public String getConceptId() { return conceptId; }
    public double getProbabilityKnown() { return probabilityKnown; }
    public void setProbabilityKnown(double probabilityKnown) { this.probabilityKnown = probabilityKnown; }
    public double getProbabilityLearned() { return probabilityLearned; }
    public void setProbabilityLearned(double probabilityLearned) { this.probabilityLearned = probabilityLearned; }
    public double getProbabilitySlip() { return probabilitySlip; }
    public void setProbabilitySlip(double probabilitySlip) { this.probabilitySlip = probabilitySlip; }
    public double getProbabilityGuess() { return probabilityGuess; }
    public void setProbabilityGuess(double probabilityGuess) { this.probabilityGuess = probabilityGuess; }
    public int getTotalAttempts() { return totalAttempts; }
    public int getCorrectAttempts() { return correctAttempts; }
    public OffsetDateTime getLastAttemptAt() { return lastAttemptAt; }
    public OffsetDateTime getNextReviewAt() { return nextReviewAt; }
    public void setNextReviewAt(OffsetDateTime nextReviewAt) { this.nextReviewAt = nextReviewAt; }
    public double getReviewIntervalDays() { return reviewIntervalDays; }
    public void setReviewIntervalDays(double reviewIntervalDays) { this.reviewIntervalDays = reviewIntervalDays; }
    public double getEaseFactor() { return easeFactor; }
    public void setEaseFactor(double easeFactor) { this.easeFactor = easeFactor; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
