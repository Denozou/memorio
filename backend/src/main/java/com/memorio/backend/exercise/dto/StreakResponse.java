package com.memorio.backend.exercise.dto;
import java.time.LocalDate;

public class StreakResponse {
    private final int currentStreak;
    private final int longestStreak;
    private final LocalDate lastActiveDate;
    private final String timezone;

    public StreakResponse(int currentStreak, int longestStreak, LocalDate lastActiveDate,
                          String timezone){
        this.currentStreak = currentStreak;
        this.longestStreak = longestStreak;
        this.lastActiveDate = lastActiveDate;
        this.timezone = timezone;

    }

    public int getCurrentStreak(){return currentStreak;}
    public int getLongestStreak(){return longestStreak;}
    public LocalDate getLastActiveDate(){return lastActiveDate;}
    public String getTimezone(){return timezone;}

}
