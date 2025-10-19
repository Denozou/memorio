package com.memorio.backend.exercise.dto;

public class TimingConfig {
    private final int studySeconds;
    private final int itemShowMs;
    private final int gapMs;


    public TimingConfig(int studySeconds, int itemShowMs, int gapMs){
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
