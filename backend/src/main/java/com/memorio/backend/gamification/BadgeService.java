package com.memorio.backend.gamification;

import com.memorio.backend.exercise.ExerciseAttemptRepository;
import com.memorio.backend.exercise.ExerciseSessionRepository;
import com.memorio.backend.exercise.ExerciseType;
import com.memorio.backend.exercise.StreakService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service responsible for evaluating and awarding badges based on user achievements.
 *
 * Badge Categories:
 * - Streak badges: STREAK_7, STREAK_30, STREAK_100
 * - Milestone badges: FIRST_ATTEMPT, EXERCISES_10, EXERCISES_50, EXERCISES_100, EXERCISES_500
 * - Accuracy badges: FIRST_PERFECT, PERFECT_10
 * - Exercise mastery: WORD_MASTER, FACE_MASTER, NUMBER_MASTER
 * - Points badges: POINTS_1000, POINTS_10000, POINTS_50000
 */
@Service
public class BadgeService {

    private final UserBadgeRepository badgeRepo;
    private final UserStatsRepository statsRepo;
    private final ExerciseSessionRepository sessionRepo;
    private final ExerciseAttemptRepository attemptRepo;
    private final StreakService streakService;

    // Bonus points for earning badges
    private static final int BONUS_STREAK_7 = 100;
    private static final int BONUS_STREAK_30 = 250;
    private static final int BONUS_STREAK_100 = 500;
    private static final int BONUS_EXERCISES_10 = 50;
    private static final int BONUS_EXERCISES_50 = 150;
    private static final int BONUS_EXERCISES_100 = 300;
    private static final int BONUS_EXERCISES_500 = 750;
    private static final int BONUS_FIRST_PERFECT = 50;
    private static final int BONUS_PERFECT_10 = 200;
    private static final int BONUS_MASTERY = 300;
    private static final int BONUS_POINTS_1000 = 100;
    private static final int BONUS_POINTS_10000 = 250;
    private static final int BONUS_POINTS_50000 = 500;

    // Thresholds
    private static final int MASTERY_EXERCISE_COUNT = 25;

    public BadgeService(UserBadgeRepository badgeRepo,
                        UserStatsRepository statsRepo,
                        ExerciseSessionRepository sessionRepo,
                        ExerciseAttemptRepository attemptRepo,
                        StreakService streakService) {
        this.badgeRepo = badgeRepo;
        this.statsRepo = statsRepo;
        this.sessionRepo = sessionRepo;
        this.attemptRepo = attemptRepo;
        this.streakService = streakService;
    }

    /**
     * Result of badge evaluation containing newly awarded badges and bonus points.
     */
    public record BadgeResult(List<String> newBadges, int bonusPoints) {}

    /**
     * Evaluates all badge conditions after an exercise completion.
     * Call this after updating user stats with the current exercise result.
     *
     * @param userId The user's ID
     * @param exerciseType The type of exercise just completed
     * @param wasPerfect Whether the current exercise had 100% accuracy
     * @param currentPoints The user's total points AFTER adding points from current exercise
     * @return BadgeResult containing newly awarded badges and total bonus points
     */
    @Transactional
    public BadgeResult evaluateAndAwardBadges(UUID userId, ExerciseType exerciseType,
                                               boolean wasPerfect, long currentPoints) {
        List<String> newBadges = new ArrayList<>();
        int bonusPoints = 0;

        // === FIRST ATTEMPT ===
        if (awardIfNew(userId, "FIRST_ATTEMPT")) {
            newBadges.add("FIRST_ATTEMPT");
        }

        // === STREAK BADGES ===
        int currentStreak = streakService.computeCurrentStreak(userId, ZoneId.of("UTC"));

        if (currentStreak >= 7 && awardIfNew(userId, "STREAK_7")) {
            newBadges.add("STREAK_7");
            bonusPoints += BONUS_STREAK_7;
        }
        if (currentStreak >= 30 && awardIfNew(userId, "STREAK_30")) {
            newBadges.add("STREAK_30");
            bonusPoints += BONUS_STREAK_30;
        }
        if (currentStreak >= 100 && awardIfNew(userId, "STREAK_100")) {
            newBadges.add("STREAK_100");
            bonusPoints += BONUS_STREAK_100;
        }

        // === EXERCISE MILESTONE BADGES ===
        long completedExercises = sessionRepo.countCompletedByUserId(userId);

        if (completedExercises >= 10 && awardIfNew(userId, "EXERCISES_10")) {
            newBadges.add("EXERCISES_10");
            bonusPoints += BONUS_EXERCISES_10;
        }
        if (completedExercises >= 50 && awardIfNew(userId, "EXERCISES_50")) {
            newBadges.add("EXERCISES_50");
            bonusPoints += BONUS_EXERCISES_50;
        }
        if (completedExercises >= 100 && awardIfNew(userId, "EXERCISES_100")) {
            newBadges.add("EXERCISES_100");
            bonusPoints += BONUS_EXERCISES_100;
        }
        if (completedExercises >= 500 && awardIfNew(userId, "EXERCISES_500")) {
            newBadges.add("EXERCISES_500");
            bonusPoints += BONUS_EXERCISES_500;
        }

        // === PERFECT SCORE BADGES ===
        if (wasPerfect) {
            // First perfect is awarded immediately when first 100% is achieved
            if (awardIfNew(userId, "FIRST_PERFECT")) {
                newBadges.add("FIRST_PERFECT");
                bonusPoints += BONUS_FIRST_PERFECT;
            }

            // Check total perfect scores for PERFECT_10
            long perfectCount = attemptRepo.countPerfectScoresByUserId(userId);
            if (perfectCount >= 10 && awardIfNew(userId, "PERFECT_10")) {
                newBadges.add("PERFECT_10");
                bonusPoints += BONUS_PERFECT_10;
            }
        }

        // === EXERCISE MASTERY BADGES ===
        // Award mastery badges when user completes 25+ exercises of a specific type
        if (exerciseType == ExerciseType.WORD_LINKING) {
            long wordCount = sessionRepo.countCompletedByUserIdAndType(userId, ExerciseType.WORD_LINKING);
            if (wordCount >= MASTERY_EXERCISE_COUNT && awardIfNew(userId, "WORD_MASTER")) {
                newBadges.add("WORD_MASTER");
                bonusPoints += BONUS_MASTERY;
            }
        }
        if (exerciseType == ExerciseType.NAMES_FACES) {
            long faceCount = sessionRepo.countCompletedByUserIdAndType(userId, ExerciseType.NAMES_FACES);
            if (faceCount >= MASTERY_EXERCISE_COUNT && awardIfNew(userId, "FACE_MASTER")) {
                newBadges.add("FACE_MASTER");
                bonusPoints += BONUS_MASTERY;
            }
        }
        if (exerciseType == ExerciseType.NUMBER_PEG) {
            long numberCount = sessionRepo.countCompletedByUserIdAndType(userId, ExerciseType.NUMBER_PEG);
            if (numberCount >= MASTERY_EXERCISE_COUNT && awardIfNew(userId, "NUMBER_MASTER")) {
                newBadges.add("NUMBER_MASTER");
                bonusPoints += BONUS_MASTERY;
            }
        }

        // === POINTS BADGES ===
        // Note: currentPoints should already include base points from current exercise
        // Bonus points from badges will be added after this evaluation
        long pointsWithBonus = currentPoints + bonusPoints;

        if (pointsWithBonus >= 1000 && awardIfNew(userId, "POINTS_1000")) {
            newBadges.add("POINTS_1000");
            bonusPoints += BONUS_POINTS_1000;
        }
        if (pointsWithBonus >= 10000 && awardIfNew(userId, "POINTS_10000")) {
            newBadges.add("POINTS_10000");
            bonusPoints += BONUS_POINTS_10000;
        }
        if (pointsWithBonus >= 50000 && awardIfNew(userId, "POINTS_50000")) {
            newBadges.add("POINTS_50000");
            bonusPoints += BONUS_POINTS_50000;
        }

        return new BadgeResult(newBadges, bonusPoints);
    }

    /**
     * Awards a badge if the user doesn't already have it.
     * @return true if badge was newly awarded, false if user already had it
     */
    private boolean awardIfNew(UUID userId, String badgeCode) {
        if (badgeRepo.existsByUserIdAndCode(userId, badgeCode)) {
            return false;
        }
        var badge = new UserBadge(UUID.randomUUID(), userId, badgeCode, OffsetDateTime.now());
        badgeRepo.save(badge);
        return true;
    }
}
