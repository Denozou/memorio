package com.memorio.backend.learning;

import com.memorio.backend.user.User;
import com.memorio.backend.user.Role;
import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.OffsetDateTime;

/**
 * Service layer for learning content (articles and quizzes).
 * Handles article access control, progress tracking, and language filtering.
 */
@Service
@Transactional
public class LearningService {
    private final ArticleRepository articleRepo;
    private final UserArticleProgressRepository progressRepo;
    private final UserRepository userRepo;
    private final ArticleCacheService cacheService;

    // Default language if user is not logged in or has no preference set
    private static final String DEFAULT_LANGUAGE = "en";

    public LearningService(ArticleRepository articleRepo,
                           UserArticleProgressRepository progressRepo,
                           UserRepository userRepo,
                           ArticleCacheService cacheService) {
        this.articleRepo = articleRepo;
        this.progressRepo = progressRepo;
        this.userRepo = userRepo;
        this.cacheService = cacheService;
    }

    /**
     * Get articles accessible to a user, filtered by their preferred language.
     *
     * Logic:
     * - Anonymous users: See intro articles in default language (English)
     * - Logged-in users: See all published articles in their preferred language
     * - Admins: See ALL articles (all languages, published and unpublished)
     *
     * @param userId The user's ID, or null for anonymous users
     * @return List of articles the user can access
     */
    public List<Article> getAccessibleArticles(UUID userId) {
        // Anonymous users: show intro articles in default language
        if (userId == null) {
            return articleRepo.findAllIntroArticlesByLanguage(DEFAULT_LANGUAGE);
        }

        // Fetch user to check role and language preference
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Admins bypass all filters (can see unpublished, all languages)
        if (user.getRole() == Role.ADMIN) {
            return articleRepo.findAllByOrderByTechniqueCategoryAscSequenceInCategoryAsc();
        }

        // Regular users: filter by their preferred language
        String userLanguage = getUserLanguage(user);
        return articleRepo.findAllPublishedByLanguage(userLanguage);
    }

    /**
     * Get a specific article by slug, with access control and language awareness.
     *
     * Security checks:
     * - Article must be published (unless user is admin)
     * - Article must be in user's preferred language (unless user is admin)
     * - Article must be unlocked (previous article quiz completed)
     * - Intro articles are always accessible
     *
     * @param slug Article slug (URL identifier)
     * @param userId User ID, or null for anonymous
     * @return The article if accessible
     * @throws NotFoundException if article doesn't exist
     * @throws IllegalStateException if article is locked or wrong language
     */
    public Article getArticleBySlug(String slug, UUID userId) {
        Article article = articleRepo.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Article not found: " + slug));

        User user = null;
        if (userId != null) {
            user = userRepo.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found"));
        }

        boolean isAdmin = user != null && user.getRole() == Role.ADMIN;

        // Admins can access anything
        if (isAdmin) {
            return article;
        }

        // Check if article is published
        if (!article.getIsPublished()) {
            throw new NotFoundException("Article not published");
        }

        // Check language match for logged-in users
        if (user != null) {
            String userLanguage = getUserLanguage(user);
            if (!article.getLanguage().equals(userLanguage)) {
                throw new IllegalStateException(
                        "This article is not available in your preferred language (" + userLanguage + "). " +
                                "Please change your language preference in settings."
                );
            }
        } else {
            // Anonymous users can only access default language
            if (!article.getLanguage().equals(DEFAULT_LANGUAGE)) {
                throw new NotFoundException("Article not found");
            }
        }

        // Anonymous users can only access intro articles
        if (userId == null && !article.getIsIntroArticle()) {
            throw new IllegalStateException("Please log in to access this article");
        }

        // Check if article is unlocked (previous article quiz completed)
        if (userId != null && !article.getIsIntroArticle()) {
            checkArticleUnlocked(article, userId, getUserLanguage(user));
        }

        return article;
    }

    /**
     * Check if an article is unlocked for the user.
     * An article is unlocked if the user completed the quiz for the previous article in the sequence.
     *
     * @param article The article to check
     * @param userId The user's ID
     * @param language The user's language (to find previous article in same language)
     * @throws IllegalStateException if article is locked
     */
    private void checkArticleUnlocked(Article article, UUID userId, String language) {
        Integer prevSequence = article.getSequenceInCategory() - 1;

        // Find previous article in same category and language
        Optional<Article> previousArticle = articleRepo.findByCategorySequenceAndLanguage(
                article.getTechniqueCategory(),
                prevSequence,
                language
        );

        if (previousArticle.isEmpty()) {
            throw new IllegalStateException("Invalid article sequence");
        }

        // Check if user completed previous article's quiz
        UserArticleProgress prevProgress = progressRepo
                .findByUserIdAndArticleId(userId, previousArticle.get().getId())
                .orElse(null);

        if (prevProgress == null || !prevProgress.getQuizCompleted()) {
            throw new IllegalStateException(
                    "Article locked. Complete the quiz for the previous article first."
            );
        }
    }

    /**
     * Get all articles in a specific category, filtered by user's language.
     *
     * @param category The technique category
     * @param userId User ID (null for anonymous)
     * @return List of articles in the category
     */
    public List<Article> getArticleByCategory(TechniqueCategory category, UUID userId) {
        String language = DEFAULT_LANGUAGE;

        if (userId != null) {
            User user = userRepo.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found"));
            language = getUserLanguage(user);
        }

        return articleRepo.findByTechniqueCategoryAndLanguage(category, language);
    }

    /**
     * Mark an article as read by a user.
     * Creates or updates progress tracking.
     *
     * @param articleId Article ID
     * @param userId User ID
     */
    public void markArticleAsRead(UUID articleId, UUID userId) {
        Article article = articleRepo.findById(articleId)
                .orElseThrow(() -> new NotFoundException("Article not found"));

        // Allow admins to mark unpublished articles as read (for testing)
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        boolean isAdmin = user.getRole() == Role.ADMIN;

        if (!article.getIsPublished() && !isAdmin) {
            throw new IllegalStateException("Article not published");
        }

        // Find or create progress record
        UserArticleProgress progress = progressRepo.findByUserIdAndArticleId(userId, articleId)
                .orElseGet(() -> {
                    UserArticleProgress newProgress = new UserArticleProgress(
                            userId,
                            articleId,
                            false, // hasRead - will be set below
                            null,  // firstReadAt - will be set below
                            false, // quizCompleted
                            null,  // quizScore
                            0,     // quizAttempts
                            null   // quizCompletedAt
                    );
                    return progressRepo.save(newProgress);
                });

        // Mark as read if not already
        if (!progress.getHasRead()) {
            progress.setHasRead(true);
            progress.setFirstReadAt(OffsetDateTime.now());
            progressRepo.save(progress);
            // Evict user progress cache to ensure fresh data on next request
            cacheService.evictAllUserProgressForArticle(userId, articleId);
        }
    }

    /**
     * Get user's progress on a specific article.
     *
     * @param userId User ID
     * @param articleId Article ID
     * @return Progress record, or null if not started
     */
    public UserArticleProgress getUserArticleProgress(UUID userId, UUID articleId) {
        return progressRepo.findByUserIdAndArticleId(userId, articleId)
                .orElse(null);
    }

    /**
     * Get all progress records for a user.
     *
     * @param userId User ID
     * @return List of progress records
     */
    public List<UserArticleProgress> getUserProgress(UUID userId) {
        return progressRepo.findByUserId(userId);
    }

    /**
     * Calculate completion percentage for a user.
     * Completion is based on quiz completion, not just reading.
     *
     * @param userId User ID
     * @return Percentage (0.0 to 100.0)
     */
    public Double getCompletionPercentage(UUID userId) {
        Double percentage = progressRepo.getCompletionPercentage(userId);
        return percentage != null ? percentage : 0.0;
    }

    /**
     * Extract user's preferred language, with fallback to default.
     *
     * @param user The user entity
     * @return Language code (e.g., "en", "pl")
     */
    private String getUserLanguage(User user) {
        String lang = user.getPreferredLanguage();
        return (lang != null && !lang.isEmpty()) ? lang : DEFAULT_LANGUAGE;
    }
}