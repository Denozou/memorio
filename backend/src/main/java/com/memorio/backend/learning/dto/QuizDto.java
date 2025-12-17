package com.memorio.backend.learning.dto;
import com.memorio.backend.learning.QuestionType;
import java.util.List;
import java.util.UUID;


public class QuizDto {
    private final UUID id;
    private final UUID articleId;
    private final String title;
    private final Integer passingScore;
    private final List<QuestionDto> questions;

    public QuizDto(UUID id, UUID articleId, String title,
                   Integer passingScore, List<QuestionDto> questions){
        this.id = id;
        this.articleId = articleId;
        this.title = title;
        this.passingScore = passingScore;
        this.questions = questions;
    }
    public UUID getId(){return id;}
    public UUID getArticleId(){return articleId;}
    public String getTitle(){return title;}
    public Integer getPassingScore(){return passingScore;}
    public List<QuestionDto> getQuestions(){return questions;}

    public static class QuestionDto {
        private final UUID id;
        private final String questionText;
        private final QuestionType questionType;
        private final Integer displayOrder;
        private final List<OptionDto> options;

        public QuestionDto(UUID id, String questionText, QuestionType questionType,
                           Integer displayOrder, List<OptionDto> options) {
            this.id = id;
            this.questionText = questionText;
            this.questionType = questionType;
            this.displayOrder = displayOrder;
            this.options = options;
        }

        public UUID getId() { return id; }
        public String getQuestionText() { return questionText; }
        public QuestionType getQuestionType() { return questionType; }
        public Integer getDisplayOrder() { return displayOrder; }
        public List<OptionDto> getOptions() { return options; }
    }
    public static class OptionDto {
        private final UUID id;
        private final String optionText;
        private final Integer displayOrder;

        public OptionDto(UUID id, String optionText, Integer displayOrder) {
            this.id = id;
            this.optionText = optionText;
            this.displayOrder = displayOrder;
        }

        public UUID getId() { return id; }
        public String getOptionText() { return optionText; }
        public Integer getDisplayOrder() { return displayOrder; }
    }

}
