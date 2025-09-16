package com.memorio.backend.exercise.dto;

import com.memorio.backend.exercise.ExerciseType;
import java.util.UUID;

public class StartExerciseResponse {

    private final UUID sessionId;
    private final ExerciseType type;
    private final Object payload;

    public StartExerciseResponse (UUID sessionId, ExerciseType type, Object payload){
        this.sessionId = sessionId;
        this.type = type;
        this.payload = payload;
    }
    public UUID getSessionId(){return sessionId;}
    public ExerciseType getTyoe(){return type;}
    public Object getPayload(){return payload;}
}
