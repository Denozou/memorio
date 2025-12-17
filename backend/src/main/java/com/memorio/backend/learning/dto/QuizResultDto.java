package com.memorio.backend.learning.dto;
import java.util.UUID;

public class QuizResultDto {

    private final UUID quizId;
    private final Integer totalQuestions;
    private final Integer correctAnswers;
    private final Integer percentage;
    private final Boolean passed;
    private final Integer passingScore;
    private final String message;

    public QuizResultDto(UUID quizId, Integer totalQuestions, Integer correctAnswers,
                         Integer percentage, Boolean passed, Integer passingScore, String message) {
        this.quizId = quizId;
        this.totalQuestions = totalQuestions;
        this.correctAnswers = correctAnswers;
        this.percentage = percentage;
        this.passed = passed;
        this.passingScore = passingScore;
        this.message = message;
    }

    public static QuizResultDto fromResult(UUID quizId, Integer total,
                                           Integer correct, Integer percentage,
                                           Boolean passed, Integer passingScore){
        String message = passed ? "Congratulations! you passed the quiz. "
                : "Keep trying! you need " + passingScore + "% to pass.";

        return new QuizResultDto(quizId, total, correct, percentage, passed, passingScore, message);

    }
    public UUID getQuizId() { return quizId; }
    public Integer getTotalQuestions() { return totalQuestions; }
    public Integer getCorrectAnswers() { return correctAnswers; }
    public Integer getPercentage() { return percentage; }
    public Boolean getPassed() { return passed; }
    public Integer getPassingScore() { return passingScore; }
    public String getMessage() { return message; }
}
