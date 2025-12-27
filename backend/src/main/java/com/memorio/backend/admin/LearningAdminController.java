package com.memorio.backend.admin;

import com.memorio.backend.admin.dto.*;
import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.learning.*;
import com.memorio.backend.learning.dto.*;
import jakarta.transaction.Transactional;
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

/**
 * Admin controller for managing learning content (articles, quizzes, questions).
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/admin/learning")
@PreAuthorize("hasRole('ADMIN')")
public class LearningAdminController {

    private final ArticleRepository articleRepo;
    private final ArticleQuizRepository quizRepo;
    private final QuizQuestionRepository questionRepo;
    private final QuizQuestionOptionRepository optionRepo;
    private final ArticleImageService articleImageService;
    private final SlugService slugService;
    private final ArticleCacheService articleCacheService;
    private final com.memorio.backend.common.validation.FileUploadValidator fileUploadValidator;

    public LearningAdminController(ArticleRepository articleRepo,
                                   ArticleQuizRepository quizRepo,
                                   QuizQuestionRepository questionRepo,
                                   QuizQuestionOptionRepository optionRepo,
                                   ArticleImageService articleImageService,
                                   SlugService slugService,
                                   ArticleCacheService articleCacheService,
                                   com.memorio.backend.common.validation.FileUploadValidator fileUploadValidator) {
        this.articleRepo = articleRepo;
        this.quizRepo = quizRepo;
        this.questionRepo = questionRepo;
        this.optionRepo = optionRepo;
        this.articleImageService = articleImageService;
        this.slugService = slugService;
        this.articleCacheService = articleCacheService;
        this.fileUploadValidator = fileUploadValidator;
    }

    /**
     * Upload cover image for an article.
     */
    @PostMapping("/articles/{articleId}/upload-image")
    public ResponseEntity<ImageUploadResponse> uploadArticleImage(
            @PathVariable UUID articleId,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {

        try {
            // Validate file upload
            fileUploadValidator.validateImageUpload(file);
            
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

    /**
     * Create a new article.
     * Validates that only one intro article exists per category PER LANGUAGE.
     * Automatically generates and validates slug from title.
     */
    @PostMapping("/articles")
    public ResponseEntity<?> createArticle(
            @Valid @RequestBody CreateArticleRequest request,
            Authentication auth) {

        // Validate and sanitize slug (auto-generate from title if needed)
        String validatedSlug = slugService.sanitizeAndValidateSlug(
                request.getSlug(),
                request.getTitle(),
                null // null = new article, no exclusion needed
        );

        // Validate intro article uniqueness per category AND language
        if (request.getIsIntroArticle()) {
            Optional<Article> existingIntro = articleRepo
                    .findByTechniqueCategoryAndIsIntroArticleTrueAndLanguage(
                            request.getTechniqueCategory(),
                            request.getLanguage()
                    );

            if (existingIntro.isPresent()) {
                Article intro = existingIntro.get();
                String errorMsg = String.format(
                        "An intro article already exists for %s in language '%s': '%s' (Sequence #%d). " +
                                "Please uncheck it first or use a different language.",
                        request.getTechniqueCategory(),
                        request.getLanguage(),
                        intro.getTitle(),
                        intro.getSequenceInCategory()
                );
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", errorMsg));
            }
        }

        // Create the article with validated slug
        Article article = new Article(
                validatedSlug, // Use validated/generated slug
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
                request.getIsPublished() != null ? request.getIsPublished() : false,
                request.getLanguage()
        );

        Article saved = articleRepo.save(article);
        // Evict cache to ensure fresh data is loaded
        articleCacheService.evictAllArticleCache();
        return ResponseEntity.ok(saved);
    }

    /**
     * Update an existing article.
     * Validates intro article uniqueness per category AND language.
     * Validates and sanitizes slug.
     */
    @PutMapping("/articles/{id}")
    public ResponseEntity<?> updateArticle(
            @PathVariable UUID id,
            @Valid @RequestBody CreateArticleRequest request) {

        Article existing = articleRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Article not found"));

        // Validate and sanitize slug (auto-generate from title if needed)
        String validatedSlug = slugService.sanitizeAndValidateSlug(
                request.getSlug(),
                request.getTitle(),
                id // Exclude current article from uniqueness check
        );

        // Validate intro article uniqueness (same logic as create)
        if (request.getIsIntroArticle()) {
            Optional<Article> existingIntro = articleRepo
                    .findByTechniqueCategoryAndIsIntroArticleTrueAndLanguage(
                            request.getTechniqueCategory(),
                            request.getLanguage()
                    );

            // Allow if this article is already the intro, or if no intro exists
            if (existingIntro.isPresent() && !existingIntro.get().getId().equals(id)) {
                Article intro = existingIntro.get();
                String errorMsg = String.format(
                        "An intro article already exists for %s in language '%s': '%s' (Sequence #%d). " +
                                "Please uncheck it first.",
                        request.getTechniqueCategory(),
                        request.getLanguage(),
                        intro.getTitle(),
                        intro.getSequenceInCategory()
                );
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", errorMsg));
            }
        }

        // Update the article with validated slug
        Article updated = new Article(
                existing.getId(),
                validatedSlug, // Use validated/generated slug
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
                request.getLanguage(),
                existing.getCreatedAt(),
                OffsetDateTime.now()
        );

        Article saved = articleRepo.save(updated);
        // Evict cache to ensure fresh data is loaded
        articleCacheService.evictAllArticleCache();
        return ResponseEntity.ok(saved);
    }

    /**
     * Delete an article and all associated data (quizzes, progress, etc.).
     */
    @DeleteMapping("/articles/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable UUID id) {
        articleRepo.deleteById(id);
        // Evict cache to ensure fresh data is loaded
        articleCacheService.evictAllArticleCache();
        return ResponseEntity.noContent().build();
    }

    /**
     * Create a quiz for an article.
     * Each article can have exactly one quiz.
     */
    @PostMapping("/articles/{articleId}/quiz")
    public ResponseEntity<?> createQuiz(
            @PathVariable UUID articleId,
            @Valid @RequestBody CreateQuizRequest request) {

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
            throw e;
        }
    }

    /**
     * Get all questions for a quiz.
     */
    @GetMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<List<QuizQuestion>> getQuestions(@PathVariable UUID quizId) {
        List<QuizQuestion> questions = questionRepo.findByQuizIdOrderByDisplayOrder(quizId);
        return ResponseEntity.ok(questions);
    }

    /**
     * Add a question to a quiz.
     */
    @PostMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<QuizQuestion> addQuestion(
            @PathVariable UUID quizId,
            @Valid @RequestBody CreateQuestionRequest request) {

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

    /**
     * Update an existing question.
     * @Transactional ensures atomicity - if the update fails, no partial changes persist.
     */
    @Transactional
    @PutMapping("/questions/{questionId}")
    public ResponseEntity<QuizQuestion> updateQuestion(
            @PathVariable UUID questionId,
            @Valid @RequestBody CreateQuestionRequest request) {

        QuizQuestion question = questionRepo.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        question.setQuestionText(request.getQuestionText());
        question.setQuestionType(request.getQuestionType());
        question.setDisplayOrder(request.getDisplayOrder());
        question.setExplanation(request.getExplanation());

        QuizQuestion updated = questionRepo.save(question);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a question and all its options.
     * @Transactional ensures both question and options are deleted atomically.
     */
    @Transactional
    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<Map<String, String>> deleteQuestion(@PathVariable UUID questionId) {
        if (!questionRepo.existsById(questionId)) {
            throw new RuntimeException("Question not found");
        }

        // Delete all options first
        List<QuizQuestionOption> options = optionRepo.findByQuestionIdOrderByDisplayOrder(questionId);
        optionRepo.deleteAll(options);

        // Delete the question
        questionRepo.deleteById(questionId);

        return ResponseEntity.ok(Map.of("message", "Question deleted successfully"));
    }

    /**
     * Get all options for a question.
     */
    @GetMapping("/questions/{questionId}/options")
    public ResponseEntity<List<QuizQuestionOption>> getOptions(@PathVariable UUID questionId) {
        List<QuizQuestionOption> options = optionRepo.findByQuestionIdOrderByDisplayOrder(questionId);
        return ResponseEntity.ok(options);
    }

    /**
     * Add an option to a question.
     */
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

    /**
     * Delete all options for a question. Used before updating options.
     * @Transactional ensures all options are deleted atomically.
     */
    @Transactional
    @DeleteMapping("/questions/{questionId}/options")
    public ResponseEntity<Map<String, String>> deleteAllOptionsForQuestion(@PathVariable UUID questionId) {
        if (!questionRepo.existsById(questionId)) {
            throw new RuntimeException("Question not found");
        }

        List<QuizQuestionOption> options = optionRepo.findByQuestionIdOrderByDisplayOrder(questionId);
        optionRepo.deleteAll(options);

        return ResponseEntity.ok(Map.of("message", "Options deleted successfully", "count", String.valueOf(options.size())));
    }
}