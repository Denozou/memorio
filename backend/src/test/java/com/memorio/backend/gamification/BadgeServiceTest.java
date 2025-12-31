package com.memorio.backend.gamification;

import com.memorio.backend.exercise.ExerciseAttemptRepository;
import com.memorio.backend.exercise.ExerciseSessionRepository;
import com.memorio.backend.exercise.ExerciseType;
import com.memorio.backend.exercise.StreakService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.ZoneId;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("BadgeService Unit Tests")
class BadgeServiceTest {

    @Mock
    private UserBadgeRepository badgeRepo;

    @Mock
    private UserStatsRepository statsRepo;

    @Mock
    private ExerciseSessionRepository sessionRepo;

    @Mock
    private ExerciseAttemptRepository attemptRepo;

    @Mock
    private StreakService streakService;

    @InjectMocks
    private BadgeService badgeService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("First Attempt Badge tests")
    class FirstAttemptBadgeTests {

        @Test
        @DisplayName("Should award FIRST_ATTEMPT badge on first exercise")
        void shouldAwardFirstAttemptBadge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(1L);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_10")).thenReturn(true);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 50);

            assertTrue(result.newBadges().contains("FIRST_ATTEMPT"));
            verify(badgeRepo).save(argThat(badge -> badge.getCode().equals("FIRST_ATTEMPT")));
        }

        @Test
        @DisplayName("Should not award FIRST_ATTEMPT if already exists")
        void shouldNotAwardFirstAttemptIfExists() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(1L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 50);

            assertFalse(result.newBadges().contains("FIRST_ATTEMPT"));
        }
    }

    @Nested
    @DisplayName("Streak Badge tests")
    class StreakBadgeTests {

        @Test
        @DisplayName("Should award STREAK_7 badge at 7 day streak")
        void shouldAwardStreak7Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "STREAK_7")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(7);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(5L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 500);

            assertTrue(result.newBadges().contains("STREAK_7"));
            assertEquals(100, result.bonusPoints());
        }

        @Test
        @DisplayName("Should award STREAK_30 badge at 30 day streak")
        void shouldAwardStreak30Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "STREAK_7")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "STREAK_30")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(30);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(30L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 500);

            assertTrue(result.newBadges().contains("STREAK_30"));
            assertTrue(result.bonusPoints() >= 250);
        }

        @Test
        @DisplayName("Should award STREAK_100 badge at 100 day streak")
        void shouldAwardStreak100Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "STREAK_7")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "STREAK_30")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "STREAK_100")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(100);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(100L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 500);

            assertTrue(result.newBadges().contains("STREAK_100"));
            assertTrue(result.bonusPoints() >= 500);
        }

        @Test
        @DisplayName("Should not award streak badge below threshold")
        void shouldNotAwardStreakBadgeBelowThreshold() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(5);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(5L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 500);

            assertFalse(result.newBadges().contains("STREAK_7"));
        }
    }

    @Nested
    @DisplayName("Exercise Milestone Badge tests")
    class ExerciseMilestoneBadgeTests {

        @Test
        @DisplayName("Should award EXERCISES_10 badge at 10 completed exercises")
        void shouldAwardExercises10Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_10")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(10L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 500);

            assertTrue(result.newBadges().contains("EXERCISES_10"));
            assertTrue(result.bonusPoints() >= 50);
        }

        @Test
        @DisplayName("Should award EXERCISES_50 badge at 50 completed exercises")
        void shouldAwardExercises50Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_10")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_50")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(50L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 500);

            assertTrue(result.newBadges().contains("EXERCISES_50"));
            assertTrue(result.bonusPoints() >= 150);
        }

        @Test
        @DisplayName("Should award EXERCISES_100 badge at 100 completed exercises")
        void shouldAwardExercises100Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_10")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_50")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_100")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(100L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 500);

            assertTrue(result.newBadges().contains("EXERCISES_100"));
            assertTrue(result.bonusPoints() >= 300);
        }

        @Test
        @DisplayName("Should award EXERCISES_500 badge at 500 completed exercises")
        void shouldAwardExercises500Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_10")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_50")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_100")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_500")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(500L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 500);

            assertTrue(result.newBadges().contains("EXERCISES_500"));
            assertTrue(result.bonusPoints() >= 750);
        }
    }

    @Nested
    @DisplayName("Perfect Score Badge tests")
    class PerfectScoreBadgeTests {

        @Test
        @DisplayName("Should award FIRST_PERFECT badge on first perfect score")
        void shouldAwardFirstPerfectBadge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_PERFECT")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(1L);
            when(attemptRepo.countPerfectScoresByUserId(userId)).thenReturn(1L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, true, 500);

            assertTrue(result.newBadges().contains("FIRST_PERFECT"));
            assertTrue(result.bonusPoints() >= 50);
        }

        @Test
        @DisplayName("Should award PERFECT_10 badge at 10 perfect scores")
        void shouldAwardPerfect10Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_PERFECT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "PERFECT_10")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(10L);
            when(attemptRepo.countPerfectScoresByUserId(userId)).thenReturn(10L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, true, 500);

            assertTrue(result.newBadges().contains("PERFECT_10"));
            assertTrue(result.bonusPoints() >= 200);
        }

        @Test
        @DisplayName("Should not check perfect badges if not perfect score")
        void shouldNotCheckPerfectBadgesIfNotPerfect() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(1L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 500);

            assertFalse(result.newBadges().contains("FIRST_PERFECT"));
            verify(attemptRepo, never()).countPerfectScoresByUserId(any());
        }
    }

    @Nested
    @DisplayName("Exercise Mastery Badge tests")
    class ExerciseMasteryBadgeTests {

        @Test
        @DisplayName("Should award WORD_MASTER badge at 25 word linking exercises")
        void shouldAwardWordMasterBadge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "WORD_MASTER")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(25L);
            when(sessionRepo.countCompletedByUserIdAndType(userId, ExerciseType.WORD_LINKING)).thenReturn(25L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 500);

            assertTrue(result.newBadges().contains("WORD_MASTER"));
            assertTrue(result.bonusPoints() >= 300);
        }

        @Test
        @DisplayName("Should award FACE_MASTER badge at 25 names faces exercises")
        void shouldAwardFaceMasterBadge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "FACE_MASTER")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(25L);
            when(sessionRepo.countCompletedByUserIdAndType(userId, ExerciseType.NAMES_FACES)).thenReturn(25L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.NAMES_FACES, false, 500);

            assertTrue(result.newBadges().contains("FACE_MASTER"));
            assertTrue(result.bonusPoints() >= 300);
        }

        @Test
        @DisplayName("Should award NUMBER_MASTER badge at 25 number peg exercises")
        void shouldAwardNumberMasterBadge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "NUMBER_MASTER")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(25L);
            when(sessionRepo.countCompletedByUserIdAndType(userId, ExerciseType.NUMBER_PEG)).thenReturn(25L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.NUMBER_PEG, false, 500);

            assertTrue(result.newBadges().contains("NUMBER_MASTER"));
            assertTrue(result.bonusPoints() >= 300);
        }

        @Test
        @DisplayName("Should not check mastery for wrong exercise type")
        void shouldNotCheckMasteryForWrongType() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(25L);

            badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.DAILY_CHALLENGE, false, 500);

            verify(sessionRepo, never()).countCompletedByUserIdAndType(any(), eq(ExerciseType.WORD_LINKING));
            verify(sessionRepo, never()).countCompletedByUserIdAndType(any(), eq(ExerciseType.NAMES_FACES));
            verify(sessionRepo, never()).countCompletedByUserIdAndType(any(), eq(ExerciseType.NUMBER_PEG));
        }
    }

    @Nested
    @DisplayName("Points Badge tests")
    class PointsBadgeTests {

        @Test
        @DisplayName("Should award POINTS_1000 badge at 1000 points")
        void shouldAwardPoints1000Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "POINTS_1000")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(1L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 1000);

            assertTrue(result.newBadges().contains("POINTS_1000"));
            assertTrue(result.bonusPoints() >= 100);
        }

        @Test
        @DisplayName("Should award POINTS_10000 badge at 10000 points")
        void shouldAwardPoints10000Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "POINTS_1000")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "POINTS_10000")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(100L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 10000);

            assertTrue(result.newBadges().contains("POINTS_10000"));
            assertTrue(result.bonusPoints() >= 250);
        }

        @Test
        @DisplayName("Should award POINTS_50000 badge at 50000 points")
        void shouldAwardPoints50000Badge() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "POINTS_1000")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "POINTS_10000")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "POINTS_50000")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(500L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 50000);

            assertTrue(result.newBadges().contains("POINTS_50000"));
            assertTrue(result.bonusPoints() >= 500);
        }

        @Test
        @DisplayName("Should consider bonus points when awarding points badges")
        void shouldConsiderBonusPointsWhenAwardingPointsBadges() {
            // User has 950 points but will get 100 bonus from STREAK_7
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "STREAK_7")).thenReturn(false);
            when(badgeRepo.existsByUserIdAndCode(userId, "POINTS_1000")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(7);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(5L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, false, 950);

            assertTrue(result.newBadges().contains("STREAK_7"));
            assertTrue(result.newBadges().contains("POINTS_1000"));
        }
    }

    @Nested
    @DisplayName("Multiple Badges tests")
    class MultipleBadgesTests {

        @Test
        @DisplayName("Should award multiple badges in single evaluation")
        void shouldAwardMultipleBadges() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(false);
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_PERFECT")).thenReturn(false);
            when(badgeRepo.existsByUserIdAndCode(userId, "POINTS_1000")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(1);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(1L);
            when(attemptRepo.countPerfectScoresByUserId(userId)).thenReturn(1L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, true, 1000);

            assertTrue(result.newBadges().contains("FIRST_ATTEMPT"));
            assertTrue(result.newBadges().contains("FIRST_PERFECT"));
            assertTrue(result.bonusPoints() > 0);
        }

        @Test
        @DisplayName("Should accumulate bonus points from multiple badges")
        void shouldAccumulateBonusPoints() {
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_ATTEMPT")).thenReturn(true);
            when(badgeRepo.existsByUserIdAndCode(userId, "STREAK_7")).thenReturn(false);
            when(badgeRepo.existsByUserIdAndCode(userId, "EXERCISES_10")).thenReturn(false);
            when(badgeRepo.existsByUserIdAndCode(userId, "FIRST_PERFECT")).thenReturn(false);
            when(streakService.computeCurrentStreak(eq(userId), any(ZoneId.class))).thenReturn(7);
            when(sessionRepo.countCompletedByUserId(userId)).thenReturn(10L);
            when(attemptRepo.countPerfectScoresByUserId(userId)).thenReturn(1L);

            BadgeService.BadgeResult result = badgeService.evaluateAndAwardBadges(
                    userId, ExerciseType.WORD_LINKING, true, 500);

            // STREAK_7 (100) + EXERCISES_10 (50) + FIRST_PERFECT (50) = 200
            assertEquals(200, result.bonusPoints());
        }
    }
}
