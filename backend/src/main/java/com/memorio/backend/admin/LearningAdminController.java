package com.memorio.backend.admin;
import com.memorio.backend.admin.dto.*;
import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.learning.*;
import com.memorio.backend.learning.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/learning")
@PreAuthorize("hasRole('ADMIN')")
public class LearningAdminController {

    private final ArticleRepository articleRepo;
    private final ArticleQuizRepository quizRepo;
    private final QuizQuestionRepository questionRepo;
    private final QuizQuestionOptionRepository optionRepo;
    private final ArticleImageService articleImageService;
    public LearningAdminController(ArticleRepository articleRepo,
                                   ArticleQuizRepository quizRepo,
                                   QuizQuestionRepository questionRepo,
                                   QuizQuestionOptionRepository optionRepo,
                                   ArticleImageService articleImageService) {
        this.articleRepo = articleRepo;
        this.quizRepo = quizRepo;
        this.questionRepo = questionRepo;
        this.optionRepo = optionRepo;
        this.articleImageService = articleImageService;
    }


    @PostMapping("/articles/{articleId}/upload-image")
    public ResponseEntity<ImageUploadResponse> uploadArticleImage(
            @PathVariable UUID articleId,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        try {
            Article article = articleRepo.findById(articleId)
                    .orElseThrow(() -> new RuntimeException("Article not found"));

            ArticleImage savedImage = articleImageService.storeImage(article, file);
            
            // Update article to reference the image
            article.setCoverImageId(savedImage.getId());
            articleRepo.save(article);

            return ResponseEntity.ok(new ImageUploadResponse(
                    savedImage.getId().toString(),
                    "Image uploaded successfully"
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ImageUploadResponse(null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ImageUploadResponse(null, "Failed to upload image: " + e.getMessage()));
        }
    }

    @PostMapping("/articles")
    public ResponseEntity<?> createArticle(
            @Valid @RequestBody CreateArticleRequest request,
            Authentication auth
            ){
        if (request.getIsIntroArticle()) {
            Optional<Article> existingIntro = articleRepo
                    .findByTechniqueCategoryAndIsIntroArticleTrue(request.getTechniqueCategory());
            if (existingIntro.isPresent()) {
                Article intro = existingIntro.get();
                String errorMsg = String.format(
                    "An intro article already exists: '%s' (Sequence #%d). Please uncheck it first.",
                    intro.getTitle(),
                    intro.getSequenceInCategory()
                );
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", errorMsg));
            }
        }

        Article article = new Article(
                request.getSlug(),
                request.getTitle(),
                request.getSubtitle(),
                request.getTechniqueCategory(),
                request.getDifficultyLevel(),
                request.getContentMarkdown(),
                request.getCoverImageUrl(),
                request.getAuthor(),
                request.getEstimatedReadMinutes(),
                request.getRequiredSkillLevel(),
                request.getSequenceInCategory(),
                request.getIsIntroArticle(),
                request.getIsPublished() != null ? request.getIsPublished() : false
        );
        Article saved = articleRepo.save(article);
        return ResponseEntity.ok(saved);
    }


    @PutMapping("/articles/{id}")
    public ResponseEntity<?> updateArticle(
            @PathVariable UUID id,
            @Valid @RequestBody CreateArticleRequest request
    ){
        Article existing = articleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        if (request.getIsIntroArticle()) {
            Optional<Article> existingIntro = articleRepo
                    .findByTechniqueCategoryAndIsIntroArticleTrue(request.getTechniqueCategory());
            // Allow if this article is already the intro, or if no intro exists
            if (existingIntro.isPresent() && !existingIntro.get().getId().equals(id)) {
                Article intro = existingIntro.get();
                String errorMsg = String.format(
                    "An intro article already exists: '%s' (Sequence #%d). Please uncheck it first.",
                    intro.getTitle(),
                    intro.getSequenceInCategory()
                );
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", errorMsg));
            }
        }

        Article updated = new Article(
                existing.getId(),
                request.getSlug(),
                request.getTitle(),
                request.getSubtitle(),
                request.getTechniqueCategory(),
                request.getDifficultyLevel(),
                request.getContentMarkdown(),
                request.getCoverImageUrl(),
                existing.getCoverImageId(),
                request.getAuthor(),
                request.getEstimatedReadMinutes(),
                request.getRequiredSkillLevel(),
                request.getSequenceInCategory(),
                request.getIsIntroArticle(),
                request.getIsPublished() != null ? request.getIsPublished() : false,
                existing.getCreatedAt(),
                OffsetDateTime.now()
        );

        Article saved = articleRepo.save(updated);
        return ResponseEntity.ok(saved);
    }
    @DeleteMapping("/articles/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable UUID id){
        articleRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/articles/{articleId}/quiz")
    public ResponseEntity<?> createQuiz(
            @PathVariable UUID articleId,
            @Valid @RequestBody CreateQuizRequest request
            ){
        try {
            // Check if quiz already exists for this article
            Optional<ArticleQuiz> existingQuiz = quizRepo.findByArticleId(articleId);
            if (existingQuiz.isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "A quiz already exists for this article. Each article can only have one quiz."));
            }

            ArticleQuiz quiz = new ArticleQuiz(
                    articleId,
                    request.getTitle(),
                    request.getPassingScore()
            );
            ArticleQuiz saved = quizRepo.save(quiz);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            // Handle database constraint violations (e.g., duplicate quiz for article)
            if (e.getMessage() != null && (e.getMessage().contains("unique") || e.getMessage().contains("duplicate"))) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "A quiz already exists for this article. Each article can only have one quiz."));
            }
            // Re-throw other exceptions
            throw e;
        }
    }


    @GetMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<List<QuizQuestion>> getQuestions(@PathVariable UUID quizId) {
        List<QuizQuestion> questions = questionRepo.findByQuizIdOrderByDisplayOrder(quizId);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<QuizQuestion> addQuestion(
            @PathVariable UUID quizId,
            @Valid @RequestBody CreateQuestionRequest request
            ){

        quizRepo.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Quiz not found"));

        QuizQuestion question = new QuizQuestion(
                quizId,
                request.getQuestionText(),
                request.getQuestionType(),
                request.getDisplayOrder(),
                request.getExplanation()
        );
        QuizQuestion saved = questionRepo.save(question);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/questions/{questionId}/options")
    public ResponseEntity<QuizQuestionOption> addOption(
            @PathVariable UUID questionId,
            @Valid @RequestBody CreateOptionRequest request) {

        questionRepo.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        QuizQuestionOption option = new QuizQuestionOption(
                questionId,
                request.getOptionText(),
                request.getIsCorrect(),
                request.getDisplayOrder()
        );
        QuizQuestionOption saved = optionRepo.save(option);
        return ResponseEntity.ok(saved);
    }
}
