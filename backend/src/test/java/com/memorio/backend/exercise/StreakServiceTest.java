package com.memorio.backend.exercise;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("StreakService Unit Tests")
class StreakServiceTest {

    @Mock
    private ExerciseSessionRepository sessionRepository;

    private StreakService streakService;

    private static final UUID TEST_USER_ID = UUID.randomUUID();
    private static final ZoneId TEST_ZONE = ZoneId.of("UTC");

    @BeforeEach
    void setUp() {
        streakService = new StreakService(sessionRepository);
    }

    @Test
    @DisplayName("Should throw exception for null userId")
    void shouldThrowExceptionForNullUserId() {
        assertThrows(IllegalArgumentException.class, () -> {
            streakService.computeCurrentStreak(null, TEST_ZONE);
        });
    }

    @Test
    @DisplayName("Should throw exception for null zone")
    void shouldThrowExceptionForNullZone() {
        assertThrows(IllegalArgumentException.class, () -> {
            streakService.computeCurrentStreak(TEST_USER_ID, null);
        });
    }

    @Test
    @DisplayName("Should return 0 for user with no sessions")
    void shouldReturnZeroForNoSessions() {
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(eq(TEST_USER_ID), any(PageRequest.class)))
                .thenReturn(Page.empty());

        int streak = streakService.computeCurrentStreak(TEST_USER_ID, TEST_ZONE);

        assertEquals(0, streak);
    }

    @Test
    @DisplayName("Should return 1 for single session today")
    void shouldReturnOneForSingleSession() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<ExerciseSession> sessions = List.of(createSession(now));
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(eq(TEST_USER_ID), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sessions));

        int streak = streakService.computeCurrentStreak(TEST_USER_ID, TEST_ZONE);

        assertEquals(1, streak);
    }

    @Test
    @DisplayName("Should return 3 for three consecutive days")
    void shouldReturnThreeForConsecutiveDays() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<ExerciseSession> sessions = List.of(
                createSession(now),
                createSession(now.minusDays(1)),
                createSession(now.minusDays(2))
        );
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(eq(TEST_USER_ID), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sessions));

        int streak = streakService.computeCurrentStreak(TEST_USER_ID, TEST_ZONE);

        assertEquals(3, streak);
    }

    @Test
    @DisplayName("Should stop counting streak when gap found")
    void shouldStopAtGap() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<ExerciseSession> sessions = List.of(
                createSession(now),
                createSession(now.minusDays(1)),
                createSession(now.minusDays(3)) // Gap - skipped day 2
        );
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(eq(TEST_USER_ID), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sessions));

        int streak = streakService.computeCurrentStreak(TEST_USER_ID, TEST_ZONE);

        assertEquals(2, streak);
    }

    @Test
    @DisplayName("Should count multiple sessions on same day as one")
    void shouldCountSameDayAsOne() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<ExerciseSession> sessions = List.of(
                createSession(now),
                createSession(now.minusHours(2)),
                createSession(now.minusHours(4)),
                createSession(now.minusDays(1)),
                createSession(now.minusDays(1).minusHours(3))
        );
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(eq(TEST_USER_ID), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sessions));

        int streak = streakService.computeCurrentStreak(TEST_USER_ID, TEST_ZONE);

        assertEquals(2, streak);
    }

    @Test
    @DisplayName("Should use finishedAt when available")
    void shouldUseFinishedAtWhenAvailable() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        ExerciseSession session = createSessionWithFinish(now.minusDays(1), now); // Started yesterday, finished today

        List<ExerciseSession> sessions = List.of(session);
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(eq(TEST_USER_ID), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sessions));

        int streak = streakService.computeCurrentStreak(TEST_USER_ID, TEST_ZONE);

        assertEquals(1, streak);
    }

    @Test
    @DisplayName("Should handle different timezone correctly")
    void shouldHandleDifferentTimezone() {
        ZoneId tokyoZone = ZoneId.of("Asia/Tokyo");
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        List<ExerciseSession> sessions = List.of(
                createSession(now),
                createSession(now.minusDays(1))
        );
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(eq(TEST_USER_ID), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sessions));

        int streak = streakService.computeCurrentStreak(TEST_USER_ID, tokyoZone);

        assertTrue(streak >= 1 && streak <= 2);
    }

    @Test
    @DisplayName("Should return 0 when session list becomes empty after filtering")
    void shouldReturnZeroWhenNoValidSessions() {
        // Using empty page to simulate no valid sessions
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(eq(TEST_USER_ID), any(PageRequest.class)))
                .thenReturn(Page.empty());

        int streak = streakService.computeCurrentStreak(TEST_USER_ID, TEST_ZONE);

        assertEquals(0, streak);
    }

    @Test
    @DisplayName("Should handle long streak correctly")
    void shouldHandleLongStreak() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        List<ExerciseSession> sessions = new ArrayList<>();
        for (int i = 0; i < 30; i++) {
            sessions.add(createSession(now.minusDays(i)));
        }

        when(sessionRepository.findByUserIdOrderByStartedAtDesc(eq(TEST_USER_ID), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sessions));

        int streak = streakService.computeCurrentStreak(TEST_USER_ID, TEST_ZONE);

        assertEquals(30, streak);
    }

    @Test
    @DisplayName("Should fallback to startedAt when finishedAt is null")
    void shouldFallbackToStartedAt() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        // Session without finishedAt uses startedAt for streak calculation
        ExerciseSession session = new ExerciseSession(
                UUID.randomUUID(),
                TEST_USER_ID,
                ExerciseType.WORD_LINKING,
                now
        );

        List<ExerciseSession> sessions = List.of(session);
        when(sessionRepository.findByUserIdOrderByStartedAtDesc(eq(TEST_USER_ID), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(sessions));

        int streak = streakService.computeCurrentStreak(TEST_USER_ID, TEST_ZONE);

        assertEquals(1, streak);
    }

    private ExerciseSession createSession(OffsetDateTime finishedAt) {
        ExerciseSession session = new ExerciseSession(
                UUID.randomUUID(),
                TEST_USER_ID,
                ExerciseType.WORD_LINKING,
                finishedAt.minusMinutes(10)
        );
        session.markFinished(finishedAt);
        return session;
    }

    private ExerciseSession createSessionWithFinish(OffsetDateTime startedAt, OffsetDateTime finishedAt) {
        ExerciseSession session = new ExerciseSession(
                UUID.randomUUID(),
                TEST_USER_ID,
                ExerciseType.WORD_LINKING,
                startedAt
        );
        session.markFinished(finishedAt);
        return session;
    }
}
