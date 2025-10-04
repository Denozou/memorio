package com.memorio.backend.exercise;
import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.time.OffsetTime;
import java.util.UUID;
@Entity
@Table(name = "exercise_sessions")
public class ExerciseSession {
    @Id
    private UUID id;
    @Column(name ="user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ExerciseType type;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "finished_at", nullable = false)
    private OffsetDateTime finishedAt;

    protected ExerciseSession(){}
    public ExerciseSession (UUID id, UUID userId, ExerciseType type,
                            OffsetDateTime startedAt){
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.startedAt = startedAt;

    }

    public UUID getId(){return id;}
    public UUID getUserId(){return userId;}
    public ExerciseType getType(){return type;}
    public OffsetDateTime getStartedAt(){return startedAt;}
    public OffsetDateTime getFinishedAt(){return finishedAt;}

    public void markFinished(OffsetDateTime when){
        this.finishedAt = when;
    }

}
