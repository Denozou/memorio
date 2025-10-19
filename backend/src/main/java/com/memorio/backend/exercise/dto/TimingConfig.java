package com.memorio.backend.exercise.dto;

public class TimingConfig {
    private final int studySeconds;
    private final int itemShowMs;
    private final int gapMs;


    public TimingConfig(int studySeconds, int itemShowMs, int gapMs){
        if(studySeconds <= 0){
            throw new IllegalArgumentException("studySeconds must be positive: " + studySeconds);
        }
        if(itemShowMs <= 0){
            throw new IllegalArgumentException("itemShowMs must be positive: " + itemShowMs);
        }
        if(gapMs < 0){
            throw new IllegalArgumentException("gapMs cannot be negative: " + gapMs);
        }


        this.studySeconds = studySeconds;
        this.itemShowMs = itemShowMs;
        this.gapMs = gapMs;
    }

    public int getStudySeconds(){
        return studySeconds;
    }
    public int getItemShowMs(){
        return itemShowMs;
    }
    public int getGapMs(){return gapMs;}
}
