package com.memorio.backend.learning;

import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.learning.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;


import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/learning")
public class LearningController {
    private final LearningService learningService;
    private final QuizService quizService;
    private final ArticleImageService articleImageService;

    public LearningController (LearningService learningService, QuizService quizService,
                               ArticleImageService articleImageService){
        this.learningService = learningService;
        this.quizService = quizService;
        this.articleImageService = articleImageService;
    }


    @GetMapping("/articles")
    public ResponseEntity<List<ArticleListDto>> getArticles(Authentication auth){
        UUID userId = auth != null ? AuthenticationUtil.extractUserId(auth) : null;

        List<Article> articles =  learningService.getAccessibleArticles(userId);
        if(userId!=null){
            List<ArticleListDto> dtos = articles.stream()
                    .map(article -> {
                        UserArticleProgress progress = learningService
                                .getUserArticleProgress(userId, article.getId());
                        return ArticleListDto.fromArticleWithProgress(article, progress);
                    }).collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        }else{//public access - thus no progress
            List<ArticleListDto> dtos = articles.stream()
                    .map(ArticleListDto::fromArticle)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(dtos);
        }
    }
    @GetMapping("/articles/{slug}")
    public ResponseEntity<ArticleDetailDto> getArticle(
            @PathVariable String slug, Authentication auth){

        UUID userId = auth != null ? AuthenticationUtil.extractUserId(auth) : null;
        Article article = learningService.getArticleBySlug(slug, userId);
        if(userId != null){
            UserArticleProgress progress = learningService.getUserArticleProgress(userId,article.getId());
            return ResponseEntity.ok(ArticleDetailDto.fromArticleWithProgress(article, progress));
        }else{
            return ResponseEntity.ok(ArticleDetailDto.fromArticle(article));
        }
    }

    @GetMapping("/articles/category/{category}")
    public ResponseEntity<List<ArticleListDto>> getArticlesByCategory(@PathVariable TechniqueCategory category,
                                                                      Authentication auth){
        UUID userId = auth != null ? AuthenticationUtil.extractUserId(auth) : null;
        List<Article> articles = learningService.getArticleByCategory(category);

        List<ArticleListDto> dtos = articles.stream()
                .map(article -> {
                    if(userId != null){
                        UserArticleProgress progress  = learningService.getUserArticleProgress(userId,article.getId());
                        return ArticleListDto.fromArticleWithProgress(article, progress);
                    }else{
                        return ArticleListDto.fromArticle(article);
                    }
                }).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);

    }
    @PostMapping("/articles/{articleId}/mark-read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID articleId,
                                           Authentication auth){

        UUID userId = AuthenticationUtil.extractUserId(auth);
        learningService.markArticleAsRead(articleId, userId);
        return ResponseEntity.ok().build();
    }
    @GetMapping("/progress")
    public ResponseEntity<UserProgressDto> getProgress(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);

        Long completed = learningService.getUserProgress(userId).stream()
                .filter(p-> p.getQuizCompleted()).count();

        Double percentage = learningService.getCompletionPercentage(userId);

        OffsetDateTime lastActivity = learningService.getUserProgress(userId)
                .stream()
                .map(p->p.getUpdatedAt())
                .max(OffsetDateTime::compareTo)
                .orElse(null);

        return ResponseEntity.ok(new UserProgressDto(completed, percentage, lastActivity));

    }
    @GetMapping("/articles/{slug}/quiz")
    public ResponseEntity<QuizDto> getQuiz(
            @PathVariable String slug,
            Authentication auth
    ){
        AuthenticationUtil.extractUserId(auth);
        QuizService.QuizWithQuestions quizData = quizService.getQuizByArticleSlug(slug);
        List<QuizDto.QuestionDto> questions = quizData.questions().stream()
                .map(q-> new QuizDto.QuestionDto(
                        q.question().getId(),
                        q.question().getQuestionText(),
                        q.question().getQuestionType(),
                        q.question().getDisplayOrder(),
                        q.options().stream()
                                .map(o-> new QuizDto.OptionDto(
                                        o.getId(),
                                        o.getOptionText(),
                                        o.getDisplayOrder()
                                )).collect(Collectors.toList())
                )).collect(Collectors.toList());

        QuizDto dto = new QuizDto(
                quizData.quiz().getId(),
                quizData.quiz().getArticleId(),
                quizData.quiz().getTitle(),
                quizData.quiz().getPassingScore(),
                questions
        );
        return ResponseEntity.ok(dto);
    }
    @PostMapping("/quiz/submit")
    public ResponseEntity<QuizResultDto> submitQuiz(
            @Valid @RequestBody SubmitQuizRequest request,
            Authentication auth
    ){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        QuizService.QuizResult result = quizService.submitQuiz(
                request.getQuizId(),
                userId,
                request.getSelectedOptionIds()
        );

        QuizResultDto dto = QuizResultDto.fromResult(
                request.getQuizId(),
                result.totalQuestions(),
                result.correctAnswers(),
                result.percentage(),
                result.passed(),
                result.passingScore()
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/images/{imageId}")
    public ResponseEntity<byte[]> getImage(@PathVariable UUID imageId) {
        ArticleImage image = articleImageService.getImage(imageId);

        return ResponseEntity.ok()
                .header("Content-Type", image.getContentType())
                .header("Content-Length", String.valueOf(image.getFileSize()))
                .header("Cache-Control", "public, max-age=31536000") // Cache for 1 year
                .body(image.getImageData());
    }

}
