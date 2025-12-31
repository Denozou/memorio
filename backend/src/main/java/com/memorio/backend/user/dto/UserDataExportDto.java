package com.memorio.backend.user.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for GDPR-compliant user data export.
 * Contains all personal data associated with a user account.
 */
public record UserDataExportDto(
        // Metadata
        ExportMetadata metadata,

        // User account information
        AccountData account,

        // Authentication providers
        List<AuthProviderData> authProviders,

        // Gamification data
        GamificationData gamification,

        // Exercise history
        List<ExerciseSessionData> exerciseHistory,

        // Learning progress
        List<ArticleProgressData> learningProgress,

        // Adaptive learning state
        List<SkillMasteryData> skillMastery
) {
    public record ExportMetadata(
            OffsetDateTime exportedAt,
            String exportVersion,
            String dataController,
            String dataProtectionContact
    ) {}

    public record AccountData(
            UUID userId,
            String email,
            String displayName,
            String role,
            Integer skillLevel,
            String preferredLanguage,
            String pictureUrl,
            Boolean emailVerified,
            Boolean twoFactorEnabled,
            OffsetDateTime twoFactorEnabledAt,
            Boolean tutorialCompleted,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}

    public record AuthProviderData(
            String provider,
            String providerUserId,
            OffsetDateTime linkedAt
    ) {}

    public record GamificationData(
            Long totalPoints,
            Long totalAttempts,
            Long totalCorrect,
            Double overallAccuracy,
            List<BadgeData> badges
    ) {
        public record BadgeData(
                String code,
                String name,
                OffsetDateTime awardedAt
        ) {}
    }

    public record ExerciseSessionData(
            UUID sessionId,
            String exerciseType,
            OffsetDateTime startedAt,
            OffsetDateTime finishedAt,
            List<AttemptData> attempts
    ) {
        public record AttemptData(
                OffsetDateTime attemptedAt,
                Integer total,
                Integer correct,
                Double accuracy,
                List<String> shownItems,
                List<String> userAnswers
        ) {}
    }

    public record ArticleProgressData(
            UUID articleId,
            String articleTitle,
            String articleSlug,
            Boolean hasRead,
            OffsetDateTime firstReadAt,
            Boolean quizCompleted,
            Integer quizScore,
            Integer quizAttempts,
            OffsetDateTime quizCompletedAt
    ) {}

    public record SkillMasteryData(
            String skillType,
            String conceptId,
            Double masteryProbability,
            Integer totalAttempts,
            Integer correctAttempts,
            OffsetDateTime lastAttemptAt,
            OffsetDateTime nextReviewAt
    ) {}
}
