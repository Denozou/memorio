package com.memorio.backend.exercise.dto;
import com.memorio.backend.exercise.ExerciseType;
import java.time.OffsetDateTime;
import java.util.UUID;

public class HistoryItem {
    private final UUID sessionId;
    private final ExerciseType type;
    private final OffsetDateTime startedAt;
    private final OffsetDateTime finishedAt;
    private final long attemptCount;

    private final Integer lastCorrect; // Integer is a wrapper class, it CAN be null. int canNOT be null;
    private final Integer lastTotal;
    private final Double lastAccuracy;

    public HistoryItem (UUID sessionId, ExerciseType type, OffsetDateTime startedAt,
                        OffsetDateTime finishedAt, long attemptCount, Integer lastCorrect,
                        Integer lastTotal, Double lastAccuracy){
        this.sessionId = sessionId;
        this.type = type;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
        this.attemptCount = attemptCount;
        this.lastCorrect = lastCorrect;
        this.lastTotal = lastTotal;
        this.lastAccuracy = lastAccuracy;
    }

    public UUID getSessionId(){return sessionId;}
    public ExerciseType getType(){return type;}
    public OffsetDateTime getStartedAt(){return startedAt;}
    public OffsetDateTime getFinishedAt(){return finishedAt;}
    public long getAttemptCount(){return attemptCount;}
    public Integer getLastCorrect(){return lastCorrect;}
    public Integer getLastTotal(){return lastTotal;}
    public Double getLastAccuracy(){return lastAccuracy;}
}
