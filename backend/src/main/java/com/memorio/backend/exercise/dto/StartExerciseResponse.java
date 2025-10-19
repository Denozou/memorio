package com.memorio.backend.exercise.dto;

import com.memorio.backend.exercise.ExerciseType;
import java.util.UUID;

public class StartExerciseResponse {

    private final UUID sessionId;
    private final ExerciseType type;
    private final Object payload;
    private final Integer skillLevel;
    private final TimingConfig timingConfig;

    public StartExerciseResponse (UUID sessionId, ExerciseType type, Object payload){
        this.sessionId = sessionId;
        this.type = type;
        this.payload = payload;
        this.skillLevel = null;
        this.timingConfig = null;
    }
    
    public StartExerciseResponse (UUID sessionId, ExerciseType type, Object payload, Integer skillLevel){
        this.sessionId = sessionId;
        this.type = type;
        this.payload = payload;
        this.skillLevel = skillLevel;
        this.timingConfig = null;
    }

    public StartExerciseResponse(UUID sessionId, ExerciseType type, Object payload, Integer skillLevel, TimingConfig timingConfig){
        this.sessionId = sessionId;
        this.type = type;
        this.payload = payload;
        this.skillLevel = skillLevel;
        this.timingConfig = timingConfig;
    }
    
    public UUID getSessionId(){return sessionId;}
    public ExerciseType getType(){return type;}
    public Object getPayload(){return payload;}
    public Integer getSkillLevel(){return skillLevel;}
    public TimingConfig getTimingConfig(){return timingConfig;}
}
