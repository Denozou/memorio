package com.memorio.backend.exercise;
import jakarta.persistence.*;
import java.util.UUID;
import java.time.OffsetDateTime;
@Entity
@Table(name = "exercise_attempts")
public class ExerciseAttempt {
    @Id
    private UUID id;
    @Column(name="session_id", nullable = false)
    private UUID sessionId;
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    @Lob
    @Column(name = "shown_words_json", nullable = false)
    private String shownWordsJson;

    @Lob
    @Column(name = "answers_json", nullable = false)
    private String answersJson;
    @Column(nullable = false)
    private int total;
    @Column(nullable = false)
    private int correct;
    @Column(nullable = false)
    private double accuracy;

    protected ExerciseAttempt(){};
    public ExerciseAttempt(UUID id, UUID sessionId, OffsetDateTime createdAt,
                           String shownWordsJson, String answersJson, int total,
                           int correct, double accuracy){
        this.id = id;
        this.sessionId = sessionId;
        this.createdAt = createdAt;
        this.shownWordsJson = shownWordsJson;
        this.answersJson = answersJson;
        this.total = total;
        this.correct = correct;
        this.accuracy = accuracy;
    }

    public UUID getId(){return id;}
    public UUID getSessionId(){return sessionId;}
    public OffsetDateTime getCreatedAt (){return createdAt;}
    public String getShownWordsJson(){return shownWordsJson;}
    public String getAnswersJson(){return answersJson;}
    public int getTotal(){return total;}
    public int getCorrect(){return correct;}
    public double getAccuracy(){return accuracy;}

}
