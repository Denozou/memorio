package com.memorio.backend.exercise;
import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.time.OffsetTime;
import java.util.Objects;
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

    @Column(name = "finished_at", nullable = true)
    private OffsetDateTime finishedAt;

    protected ExerciseSession(){}
    public ExerciseSession (UUID id, UUID userId, ExerciseType type,
                            OffsetDateTime startedAt){
        this.id = Objects.requireNonNull(id, "id cannot be null");
        this.userId = Objects.requireNonNull(userId, "userId cannot be null");
        this.type = Objects.requireNonNull(type, "type cannot be null");
        this.startedAt = Objects.requireNonNull(startedAt, "startedAt cannot be null");

    }

    public UUID getId(){return id;}
    public UUID getUserId(){return userId;}
    public ExerciseType getType(){return type;}
    public OffsetDateTime getStartedAt(){return startedAt;}
    public OffsetDateTime getFinishedAt(){return finishedAt;}

    public void markFinished(OffsetDateTime when){
        this.finishedAt = Objects.requireNonNull(when, "Finish time cannot be null");
    }

}
