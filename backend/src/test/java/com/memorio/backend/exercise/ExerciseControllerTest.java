package com.memorio.backend.exercise;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.memorio.backend.adaptive.AdaptiveDifficultyService;
import com.memorio.backend.exercise.dto.StartExerciseRequest;
import com.memorio.backend.exercise.dto.SubmitExerciseRequest;
import com.memorio.backend.faces.FacePickerService;
import com.memorio.backend.faces.Person;
import com.memorio.backend.gamification.UserBadgeRepository;
import com.memorio.backend.gamification.UserStats;
import com.memorio.backend.gamification.UserStatsRepository;
import com.memorio.backend.lexicon.WordPicker;
import com.memorio.backend.user.User;
import com.memorio.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ExerciseController Unit Tests")
class ExerciseControllerTest {

    @Mock
    private ExerciseSessionRepository sessionRepository;

    @Mock
    private ExerciseAttemptRepository attemptRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private UserStatsRepository userStatsRepository;

    @Mock
    private UserBadgeRepository userBadgeRepository;

    @Mock
    private StreakService streakService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private WordPicker wordPicker;

    @Mock
    private FacePickerService facePickerService;

    @Mock
    private NumberPegService numberPegService;

    @Mock
    private AdaptiveDifficultyService adaptiveService;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ExerciseController exerciseController;

    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail("test@example.com");
        testUser.setDisplayName("Test User");
        testUser.setSkillLevel(5);
        testUser.setPreferredLanguage("en");

        when(authentication.getName()).thenReturn(userId.toString());
    }

    @Test
    @DisplayName("Should start word linking exercise")
    void shouldStartWordLinkingExercise() {
        StartExerciseRequest request = new StartExerciseRequest();
        request.setType(ExerciseType.WORD_LINKING);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(wordPicker.pickWords(anyString(), anyInt(), anyInt()))
            .thenReturn(List.of("word1", "word2", "word3"));
        when(sessionRepository.save(any(ExerciseSession.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var response = exerciseController.start(request, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(ExerciseType.WORD_LINKING, response.getBody().getType());
        assertNotNull(response.getBody().getSessionId());
        verify(sessionRepository).save(any(ExerciseSession.class));
        verify(wordPicker).pickWords(eq("en"), eq(5), anyInt());
    }

    @Test
    @DisplayName("Should calculate correct word count for skill level")
    void shouldCalculateWordCountForSkillLevel() {
        testUser.setSkillLevel(1);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(wordPicker.pickWords(anyString(), anyInt(), eq(12)))
            .thenReturn(List.of("word1"));
        when(sessionRepository.save(any(ExerciseSession.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        StartExerciseRequest request = new StartExerciseRequest();
        request.setType(ExerciseType.WORD_LINKING);

        exerciseController.start(request, authentication);

        verify(wordPicker).pickWords(anyString(), eq(1), eq(12));
    }

    @Test
    @DisplayName("Should start names and faces exercise")
    void shouldStartNamesAndFacesExercise() {
        StartExerciseRequest request = new StartExerciseRequest();
        request.setType(ExerciseType.NAMES_FACES);

        Person mockPerson = new Person();
        mockPerson.setPersonName("john_doe");
        mockPerson.setDisplayName("John Doe");

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(facePickerService.pickFaces(anyInt(), anyInt())).thenReturn(List.of(mockPerson));
        when(sessionRepository.save(any(ExerciseSession.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var response = exerciseController.start(request, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(ExerciseType.NAMES_FACES, response.getBody().getType());
        verify(facePickerService).pickFaces(eq(5), anyInt());
    }

    @Test
    @DisplayName("Should start number peg exercise")
    void shouldStartNumberPegExercise() {
        StartExerciseRequest request = new StartExerciseRequest();
        request.setType(ExerciseType.NUMBER_PEG);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(numberPegService.generateDigitSequence(anyInt()))
            .thenReturn(List.of(1, 2, 3, 4, 5));
        when(numberPegService.getHintWord(anyInt(), anyString()))
            .thenReturn("hint");
        when(sessionRepository.save(any(ExerciseSession.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var response = exerciseController.start(request, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(ExerciseType.NUMBER_PEG, response.getBody().getType());
        verify(numberPegService).generateDigitSequence(5);
    }

    @Test
    @DisplayName("Should handle daily challenge exercise type")
    void shouldHandleDailyChallengeType() {
        StartExerciseRequest request = new StartExerciseRequest();
        request.setType(ExerciseType.DAILY_CHALLENGE);

        when(sessionRepository.save(any(ExerciseSession.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var response = exerciseController.start(request, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(ExerciseType.WORD_LINKING, response.getBody().getType());
    }

    @Test
    @DisplayName("Should submit exercise with perfect score")
    void shouldSubmitExerciseWithPerfectScore() throws Exception {
        UUID sessionId = UUID.randomUUID();
        ExerciseSession session = new ExerciseSession(
            sessionId, userId, ExerciseType.WORD_LINKING, OffsetDateTime.now()
        );

        SubmitExerciseRequest request = new SubmitExerciseRequest();
        request.setSessionId(sessionId);
        request.setType(ExerciseType.WORD_LINKING);
        request.setShownWords(List.of("word1", "word2", "word3"));
        request.setAnswers(List.of("word1", "word2", "word3"));

        when(sessionRepository.findByIdAndUserId(sessionId, userId))
            .thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(attemptRepository.save(any(ExerciseAttempt.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(userStatsRepository.findById(userId))
            .thenReturn(Optional.of(new UserStats(userId)));
        when(userStatsRepository.save(any(UserStats.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(userBadgeRepository.existsByUserIdAndCode(any(), any()))
            .thenReturn(false);
        when(streakService.computeCurrentStreak(any(), any())).thenReturn(1);

        var response = exerciseController.submit(request, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(3, response.getBody().getCorrect());
        assertEquals(3, response.getBody().getTotal());
        assertEquals(1.0, response.getBody().getAccuracy());
        verify(attemptRepository).save(any(ExerciseAttempt.class));
    }

    @Test
    @DisplayName("Should calculate accuracy correctly for partial answers")
    void shouldCalculatePartialAccuracy() throws Exception {
        UUID sessionId = UUID.randomUUID();
        ExerciseSession session = new ExerciseSession(
            sessionId, userId, ExerciseType.WORD_LINKING, OffsetDateTime.now()
        );

        SubmitExerciseRequest request = new SubmitExerciseRequest();
        request.setSessionId(sessionId);
        request.setType(ExerciseType.WORD_LINKING);
        request.setShownWords(List.of("word1", "word2", "word3", "word4"));
        request.setAnswers(List.of("word1", "word3"));

        when(sessionRepository.findByIdAndUserId(sessionId, userId))
            .thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(attemptRepository.save(any(ExerciseAttempt.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(userStatsRepository.findById(userId))
            .thenReturn(Optional.of(new UserStats(userId)));
        when(userStatsRepository.save(any(UserStats.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(userBadgeRepository.existsByUserIdAndCode(any(), any()))
            .thenReturn(false);
        when(streakService.computeCurrentStreak(any(), any())).thenReturn(1);

        var response = exerciseController.submit(request, authentication);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(2, response.getBody().getCorrect());
        assertEquals(4, response.getBody().getTotal());
        assertEquals(0.5, response.getBody().getAccuracy());
    }

    @Test
    @DisplayName("Should award FIRST_ATTEMPT badge")
    void shouldAwardFirstAttemptBadge() throws Exception {
        UUID sessionId = UUID.randomUUID();
        ExerciseSession session = new ExerciseSession(
            sessionId, userId, ExerciseType.WORD_LINKING, OffsetDateTime.now()
        );

        SubmitExerciseRequest request = new SubmitExerciseRequest();
        request.setSessionId(sessionId);
        request.setType(ExerciseType.WORD_LINKING);
        request.setShownWords(List.of("word1"));
        request.setAnswers(List.of("word1"));

        when(sessionRepository.findByIdAndUserId(sessionId, userId))
            .thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(attemptRepository.save(any(ExerciseAttempt.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(userStatsRepository.findById(userId))
            .thenReturn(Optional.of(new UserStats(userId)));
        when(userBadgeRepository.existsByUserIdAndCode(userId, "FIRST_ATTEMPT"))
            .thenReturn(false);
        when(userBadgeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(streakService.computeCurrentStreak(any(), any())).thenReturn(1);

        var response = exerciseController.submit(request, authentication);

        assertNotNull(response.getBody());
        assertTrue(response.getBody().getNewBadges().contains("FIRST_ATTEMPT"));
        verify(userBadgeRepository).save(any());
    }

    @Test
    @DisplayName("Should increase skill level on high accuracy")
    void shouldIncreaseSkillLevelOnHighAccuracy() throws Exception {
        testUser.setSkillLevel(5);
        UUID sessionId = UUID.randomUUID();
        ExerciseSession session = new ExerciseSession(
            sessionId, userId, ExerciseType.WORD_LINKING, OffsetDateTime.now()
        );

        SubmitExerciseRequest request = new SubmitExerciseRequest();
        request.setSessionId(sessionId);
        request.setType(ExerciseType.WORD_LINKING);
        request.setShownWords(List.of("w1", "w2", "w3", "w4", "w5"));
        request.setAnswers(List.of("w1", "w2", "w3", "w4", "w5"));

        when(sessionRepository.findByIdAndUserId(sessionId, userId))
            .thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(attemptRepository.save(any(ExerciseAttempt.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(userStatsRepository.findById(userId))
            .thenReturn(Optional.of(new UserStats(userId)));
        when(userBadgeRepository.existsByUserIdAndCode(any(), any()))
            .thenReturn(true);
        when(streakService.computeCurrentStreak(any(), any())).thenReturn(1);

        var response = exerciseController.submit(request, authentication);

        assertEquals(6, testUser.getSkillLevel());
        assertNotNull(response.getBody());
        assertEquals(6, response.getBody().getNextLevel());
    }

    @Test
    @DisplayName("Should decrease skill level on low accuracy")
    void shouldDecreaseSkillLevelOnLowAccuracy() throws Exception {
        testUser.setSkillLevel(5);
        UUID sessionId = UUID.randomUUID();
        ExerciseSession session = new ExerciseSession(
            sessionId, userId, ExerciseType.WORD_LINKING, OffsetDateTime.now()
        );

        SubmitExerciseRequest request = new SubmitExerciseRequest();
        request.setSessionId(sessionId);
        request.setType(ExerciseType.WORD_LINKING);
        request.setShownWords(List.of("w1", "w2", "w3", "w4", "w5"));
        request.setAnswers(List.of("w1"));

        when(sessionRepository.findByIdAndUserId(sessionId, userId))
            .thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(attemptRepository.save(any(ExerciseAttempt.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(userStatsRepository.findById(userId))
            .thenReturn(Optional.of(new UserStats(userId)));
        when(userBadgeRepository.existsByUserIdAndCode(any(), any()))
            .thenReturn(true);
        when(streakService.computeCurrentStreak(any(), any())).thenReturn(1);

        var response = exerciseController.submit(request, authentication);

        assertEquals(4, testUser.getSkillLevel());
        assertNotNull(response.getBody());
        assertEquals(4, response.getBody().getNextLevel());
    }

    @Test
    @DisplayName("Should not decrease skill level below minimum")
    void shouldNotDecreaseSkillBelowMinimum() throws Exception {
        testUser.setSkillLevel(1);
        UUID sessionId = UUID.randomUUID();
        ExerciseSession session = new ExerciseSession(
            sessionId, userId, ExerciseType.WORD_LINKING, OffsetDateTime.now()
        );

        SubmitExerciseRequest request = new SubmitExerciseRequest();
        request.setSessionId(sessionId);
        request.setType(ExerciseType.WORD_LINKING);
        request.setShownWords(List.of("w1", "w2", "w3"));
        request.setAnswers(List.of());

        when(sessionRepository.findByIdAndUserId(sessionId, userId))
            .thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(attemptRepository.save(any(ExerciseAttempt.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(userStatsRepository.findById(userId))
            .thenReturn(Optional.of(new UserStats(userId)));
        when(userBadgeRepository.existsByUserIdAndCode(any(), any()))
            .thenReturn(true);
        when(streakService.computeCurrentStreak(any(), any())).thenReturn(1);

        exerciseController.submit(request, authentication);

        assertEquals(1, testUser.getSkillLevel());
    }

    @Test
    @DisplayName("Should record adaptive difficulty attempt")
    void shouldRecordAdaptiveDifficultyAttempt() throws Exception {
        UUID sessionId = UUID.randomUUID();
        ExerciseSession session = new ExerciseSession(
            sessionId, userId, ExerciseType.WORD_LINKING, OffsetDateTime.now()
        );

        SubmitExerciseRequest request = new SubmitExerciseRequest();
        request.setSessionId(sessionId);
        request.setType(ExerciseType.WORD_LINKING);
        request.setShownWords(List.of("w1", "w2"));
        request.setAnswers(List.of("w1", "w2"));

        when(sessionRepository.findByIdAndUserId(sessionId, userId))
            .thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(attemptRepository.save(any(ExerciseAttempt.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
        when(userStatsRepository.findById(userId))
            .thenReturn(Optional.of(new UserStats(userId)));
        when(userBadgeRepository.existsByUserIdAndCode(any(), any()))
            .thenReturn(true);
        when(streakService.computeCurrentStreak(any(), any())).thenReturn(1);

        exerciseController.submit(request, authentication);

        verify(adaptiveService).recordAttempt(
            eq(userId),
            eq("WORD_LINKING"),
            isNull(),
            eq(true),
            eq(5),
            eq(sessionId)
        );
    }
}
