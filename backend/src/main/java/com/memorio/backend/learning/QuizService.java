package com.memorio.backend.learning;


import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.adaptive.AdaptiveDifficultyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;


@Service
@Transactional
public class QuizService {

    private final ArticleRepository articleRepo;
    private final ArticleQuizRepository quizRepo;
    private final QuizQuestionRepository questionRepo;
    private final QuizQuestionOptionRepository optionRepo;
    private final UserArticleProgressRepository progressRepo;
    private final AdaptiveDifficultyService adaptiveService;

    public QuizService(ArticleRepository articleRepo, ArticleQuizRepository quizRepo,
                       QuizQuestionRepository questionRepo, QuizQuestionOptionRepository optionRepo,
                       UserArticleProgressRepository progressRepo, AdaptiveDifficultyService adaptiveService){
        this.articleRepo = articleRepo;
        this.quizRepo = quizRepo;
        this.questionRepo = questionRepo;
        this.optionRepo = optionRepo;
        this.progressRepo = progressRepo;
        this.adaptiveService = adaptiveService;
    }

    public QuizWithQuestions getQuizByArticleSlug(String articleSlug){
        Article article = articleRepo.findBySlug(articleSlug)
                .orElseThrow(()-> new NotFoundException("Article not found: " + articleSlug));

        ArticleQuiz quiz = quizRepo.findByArticleId(article.getId())
                .orElseThrow(()-> new NotFoundException("Quiz not found for  article"));
        List<QuizQuestion> questions = questionRepo.findByQuizIdOrderByDisplayOrder(quiz.getId());
        List<QuestionWithOptions> questionWithOptions = questions.stream()
                .map(question -> {
                    List<QuizQuestionOption> options = optionRepo
                            .findByQuestionIdOrderByDisplayOrder(question.getId());
                    return new QuestionWithOptions(question, options);
                }).toList();
        return new QuizWithQuestions(quiz, questionWithOptions);
    }

    public QuizResult submitQuiz(UUID quizId, UUID userId, List <UUID> answers){
        ArticleQuiz quiz = quizRepo.findById(quizId)
                .orElseThrow(()-> new NotFoundException("Quiz not found"));


        List<QuizQuestion> questions = questionRepo.findByQuizIdOrderByDisplayOrder(quizId);
        if(answers.size() != questions.size()){
            throw new IllegalArgumentException("Expected " + questions.size()
                    + " answers, got " + answers.size());
        }

        int correctCount = 0;
        for (int i = 0; i < questions.size(); i++){
            UUID questionId = questions.get(i).getId();
            UUID selectedOptionId = answers.get(i);

            QuizQuestionOption selectedOption = optionRepo.findById(selectedOptionId)
                    .orElseThrow(()->new NotFoundException("Option not found"));

            if(!selectedOption.getQuestionId().equals(questionId)){
                throw new IllegalArgumentException("Option does not belong to question");
            }

            if(selectedOption.getIsCorrect()){
                correctCount++;
            }
        }

        int percentage = (int) Math.round((correctCount * 100.0) / questions.size());
        boolean passed = percentage >= quiz.getPassingScore();

        updateQuizProgress(quiz.getArticleId(), userId, percentage, passed);
        
        // ========== ADAPTIVE DIFFICULTY: Track quiz performance in BKT ==========
        adaptiveService.recordAttempt(
            userId,
            "QUIZ",
            quiz.getArticleId().toString(),  // Track per-article mastery
            passed,
            1,  // Quizzes don't have difficulty levels, use 1
            null  // No exercise session for quizzes
        );

        return new QuizResult(
                quizId,
                questions.size(),
                correctCount,
                percentage,
                passed,
                quiz.getPassingScore()
        );



    }
    private void updateQuizProgress(UUID articleId, UUID userId, int score, boolean passed){
        UserArticleProgress progress = progressRepo
                .findByUserIdAndArticleId(userId,articleId)
                .orElseGet(()->{
                    UserArticleProgress newProgress = new UserArticleProgress(
                            userId,
                            articleId,
                            false,
                            null,
                            false,
                            null,
                            0,
                            null
                    );
                    return progressRepo.save(newProgress);
                });
        
        // Update existing progress using setters
        int newAttempts = progress.getQuizAttempts()+1;
        boolean shouldUpdateScore = progress.getQuizScore() == null || score > progress.getQuizScore();
        Integer finalScore = shouldUpdateScore ? score : progress.getQuizScore();
        boolean quizCompleted = passed || progress.getQuizCompleted();
        
        progress.setQuizAttempts(newAttempts);
        progress.setQuizScore(finalScore);
        progress.setQuizCompleted(quizCompleted);
        
        if (quizCompleted && progress.getQuizCompletedAt() == null) {
            progress.setQuizCompletedAt(OffsetDateTime.now());
        }
        
        progressRepo.save(progress);
    }


    public record QuizWithQuestions(ArticleQuiz quiz, List<QuestionWithOptions> questions){

    }
    public record QuestionWithOptions(QuizQuestion question, List<QuizQuestionOption>options){

    }

    public record QuizResult(UUID quizId,
                             int totalQuestions,
                             int correctAnswers,
                             int percentage,
                             boolean passed,
                             int passingScore){}
}
