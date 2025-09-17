package com.memorio.backend.exercise.dto;

import com.memorio.backend.exercise.ExerciseType;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

public class SubmitExerciseResponse {
    private final UUID sessionId;
    private final ExerciseType type;
    private final int total;
    private final int correct;
    private final double accuracy;
    private final List<String> correctWords;
    private final List<String> missedWords;
    private final List<String> extraAnswers;
    private final int pointsEarned;
    private final List<String> newBadges;

    public SubmitExerciseResponse(
            UUID sessionId,
            ExerciseType type,
            int total,
            int correct,
            double accuracy,
            List<String> correctWords,
            List<String> missedWords,
            List<String> extraAnswers,
            int pointsEarned,
            List<String> newBadges
    ) {
        this.sessionId = sessionId;
        this.type = type;
        this.total = total;
        this.correct = correct;
        this.accuracy = accuracy;
        this.correctWords = correctWords == null ? Collections.emptyList() : correctWords;
        this.missedWords = missedWords == null ? Collections.emptyList() : missedWords;
        this.extraAnswers = extraAnswers == null ? Collections.emptyList() : extraAnswers;
        this.pointsEarned = pointsEarned;
        this.newBadges = newBadges == null ? Collections.emptyList() : newBadges;
    }

    public UUID getSessionId(){return  sessionId;}
    public ExerciseType getType(){return type;}
    public int getTotal() {return total;}
    public int getCorrect(){return correct;}
    public double getAccuracy(){return accuracy;}
    public List<String> getCorrectWords(){return correctWords;}
    public List<String> getMissedWords(){return missedWords;}
    public List<String> getExtraAnswers(){return extraAnswers;}
    public int getPointsEarned(){return pointsEarned;}
    public List<String> getNewBadges(){return newBadges;}

}
