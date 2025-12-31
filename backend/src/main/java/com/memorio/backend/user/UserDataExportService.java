package com.memorio.backend.user;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.memorio.backend.adaptive.SkillAttemptHistoryRepository;
import com.memorio.backend.adaptive.UserSkillMastery;
import com.memorio.backend.adaptive.UserSkillMasteryRepository;
import com.memorio.backend.exercise.ExerciseAttempt;
import com.memorio.backend.exercise.ExerciseAttemptRepository;
import com.memorio.backend.exercise.ExerciseSession;
import com.memorio.backend.exercise.ExerciseSessionRepository;
import com.memorio.backend.gamification.UserBadge;
import com.memorio.backend.gamification.UserBadgeRepository;
import com.memorio.backend.gamification.UserStats;
import com.memorio.backend.gamification.UserStatsRepository;
import com.memorio.backend.learning.Article;
import com.memorio.backend.learning.ArticleRepository;
import com.memorio.backend.learning.UserArticleProgress;
import com.memorio.backend.learning.UserArticleProgressRepository;
import com.memorio.backend.user.dto.UserDataExportDto;
import com.memorio.backend.user.dto.UserDataExportDto.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for GDPR-compliant user data export and account deletion.
 */
@Service
public class UserDataExportService {

    private final UserRepository userRepository;
    private final UserIdentityRepository userIdentityRepository;
    private final UserStatsRepository userStatsRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final ExerciseSessionRepository exerciseSessionRepository;
    private final ExerciseAttemptRepository exerciseAttemptRepository;
    private final UserArticleProgressRepository articleProgressRepository;
    private final ArticleRepository articleRepository;
    private final UserSkillMasteryRepository skillMasteryRepository;
    private final ObjectMapper objectMapper;

    // Badge code to human-readable name mapping
    private static final Map<String, String> BADGE_NAMES = Map.ofEntries(
            Map.entry("FIRST_ATTEMPT", "First Steps"),
            Map.entry("FIRST_PERFECT", "Perfect Score"),
            Map.entry("TEN_EXERCISES", "Dedicated Learner"),
            Map.entry("HUNDRED_EXERCISES", "Exercise Master"),
            Map.entry("WEEK_STREAK", "Week Warrior"),
            Map.entry("MONTH_STREAK", "Monthly Champion"),
            Map.entry("POINT_MILESTONE_100", "Century Club"),
            Map.entry("POINT_MILESTONE_500", "Point Collector"),
            Map.entry("POINT_MILESTONE_1000", "Point Master"),
            Map.entry("FIRST_ARTICLE", "Knowledge Seeker"),
            Map.entry("TEN_ARTICLES", "Avid Reader"),
            Map.entry("ALL_ARTICLES", "Scholar"),
            Map.entry("FIRST_QUIZ", "Quiz Taker"),
            Map.entry("QUIZ_MASTER", "Quiz Master"),
            Map.entry("OAUTH_USER", "Social Connector"),
            Map.entry("TWO_FACTOR_ENABLED", "Security Champion")
    );

    public UserDataExportService(
            UserRepository userRepository,
            UserIdentityRepository userIdentityRepository,
            UserStatsRepository userStatsRepository,
            UserBadgeRepository userBadgeRepository,
            ExerciseSessionRepository exerciseSessionRepository,
            ExerciseAttemptRepository exerciseAttemptRepository,
            UserArticleProgressRepository articleProgressRepository,
            ArticleRepository articleRepository,
            UserSkillMasteryRepository skillMasteryRepository,
            ObjectMapper objectMapper) {
        this.userRepository = userRepository;
        this.userIdentityRepository = userIdentityRepository;
        this.userStatsRepository = userStatsRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.exerciseSessionRepository = exerciseSessionRepository;
        this.exerciseAttemptRepository = exerciseAttemptRepository;
        this.articleProgressRepository = articleProgressRepository;
        this.articleRepository = articleRepository;
        this.skillMasteryRepository = skillMasteryRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Export all user data for GDPR compliance.
     *
     * @param userId The user ID
     * @return Complete user data export
     */
    @Transactional(readOnly = true)
    public UserDataExportDto exportUserData(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new UserDataExportDto(
                buildMetadata(),
                buildAccountData(user),
                buildAuthProviders(userId),
                buildGamificationData(userId),
                buildExerciseHistory(userId),
                buildLearningProgress(userId),
                buildSkillMastery(userId)
        );
    }

    /**
     * Delete user account and all associated data.
     * Most data is automatically cascade-deleted by the database.
     *
     * @param userId The user ID to delete
     */
    @Transactional
    public void deleteUserAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // The database has ON DELETE CASCADE configured for all user-related tables
        // Simply deleting the user will cascade to:
        // - user_identities
        // - verification_tokens
        // - user_stats
        // - user_badges
        // - exercise_sessions (and exercise_attempts via cascade)
        // - user_article_progress
        // - user_skill_mastery
        // - skill_attempt_history

        userRepository.delete(user);
        userRepository.flush();
    }

    private ExportMetadata buildMetadata() {
        return new ExportMetadata(
                OffsetDateTime.now(),
                "1.0",
                "Memorio",
                "privacy@memorio.app"
        );
    }

    private AccountData buildAccountData(User user) {
        return new AccountData(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name(),
                user.getSkillLevel(),
                user.getPreferredLanguage(),
                user.getPictureUrl(),
                user.isEmailVerified(),
                user.isTwoFactorEnabled(),
                user.getTwoFactorEnabledAt(),
                user.isTutorialCompleted(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    private List<AuthProviderData> buildAuthProviders(UUID userId) {
        return userIdentityRepository.findByUserId(userId).stream()
                .map(identity -> new AuthProviderData(
                        identity.getProvider(),
                        identity.getProviderUserId(),
                        identity.getCreatedAt()
                ))
                .toList();
    }

    private GamificationData buildGamificationData(UUID userId) {
        UserStats stats = userStatsRepository.findById(userId).orElse(null);
        List<UserBadge> badges = userBadgeRepository.findByUserId(userId);

        long totalPoints = stats != null ? stats.getTotalPoints() : 0;
        long totalAttempts = stats != null ? stats.getTotalAttempts() : 0;
        long totalCorrect = stats != null ? stats.getTotalCorrect() : 0;
        double accuracy = totalAttempts > 0 ? (double) totalCorrect / totalAttempts * 100 : 0;

        List<GamificationData.BadgeData> badgeData = badges.stream()
                .map(badge -> new GamificationData.BadgeData(
                        badge.getCode(),
                        BADGE_NAMES.getOrDefault(badge.getCode(), badge.getCode()),
                        badge.getAwardedAt()
                ))
                .toList();

        return new GamificationData(totalPoints, totalAttempts, totalCorrect, accuracy, badgeData);
    }

    private List<ExerciseSessionData> buildExerciseHistory(UUID userId) {
        // Get all sessions (limited to last 1000 for performance)
        var sessions = exerciseSessionRepository.findByUserIdOrderByStartedAtDesc(
                userId, PageRequest.of(0, 1000)
        ).getContent();

        if (sessions.isEmpty()) {
            return List.of();
        }

        // Get all attempts for these sessions
        List<UUID> sessionIds = sessions.stream()
                .map(ExerciseSession::getId)
                .toList();

        // Group attempts by session
        Map<UUID, List<ExerciseAttempt>> attemptsBySession = new HashMap<>();
        for (UUID sessionId : sessionIds) {
            List<ExerciseAttempt> attempts = exerciseAttemptRepository.findBySessionId(sessionId);
            attemptsBySession.put(sessionId, attempts);
        }

        return sessions.stream()
                .map(session -> new ExerciseSessionData(
                        session.getId(),
                        session.getType().name(),
                        session.getStartedAt(),
                        session.getFinishedAt(),
                        buildAttempts(attemptsBySession.getOrDefault(session.getId(), List.of()))
                ))
                .toList();
    }

    private List<ExerciseSessionData.AttemptData> buildAttempts(List<ExerciseAttempt> attempts) {
        return attempts.stream()
                .map(attempt -> new ExerciseSessionData.AttemptData(
                        attempt.getCreatedAt(),
                        attempt.getTotal(),
                        attempt.getCorrect(),
                        attempt.getAccuracy(),
                        parseJsonList(attempt.getShownWordsJson()),
                        parseJsonList(attempt.getAnswersJson())
                ))
                .toList();
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<ArticleProgressData> buildLearningProgress(UUID userId) {
        List<UserArticleProgress> progressList = articleProgressRepository.findByUserId(userId);

        return progressList.stream()
                .map(progress -> {
                    Article article = articleRepository.findById(progress.getArticleId()).orElse(null);
                    return new ArticleProgressData(
                            progress.getArticleId(),
                            article != null ? article.getTitle() : "Unknown Article",
                            article != null ? article.getSlug() : "unknown",
                            progress.getHasRead(),
                            progress.getFirstReadAt(),
                            progress.getQuizCompleted(),
                            progress.getQuizScore(),
                            progress.getQuizAttempts(),
                            progress.getQuizCompletedAt()
                    );
                })
                .toList();
    }

    private List<SkillMasteryData> buildSkillMastery(UUID userId) {
        List<UserSkillMastery> masteryList = skillMasteryRepository.findByUserId(userId);

        return masteryList.stream()
                .map(mastery -> new SkillMasteryData(
                        mastery.getSkillType(),
                        mastery.getConceptId(),
                        mastery.getProbabilityKnown(),
                        mastery.getTotalAttempts(),
                        mastery.getCorrectAttempts(),
                        mastery.getLastAttemptAt(),
                        mastery.getNextReviewAt()
                ))
                .toList();
    }
}
