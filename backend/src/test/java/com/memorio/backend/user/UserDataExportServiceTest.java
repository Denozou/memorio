package com.memorio.backend.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.memorio.backend.adaptive.UserSkillMasteryRepository;
import com.memorio.backend.exercise.*;
import com.memorio.backend.gamification.UserBadge;
import com.memorio.backend.gamification.UserBadgeRepository;
import com.memorio.backend.gamification.UserStats;
import com.memorio.backend.gamification.UserStatsRepository;
import com.memorio.backend.learning.*;
import com.memorio.backend.user.dto.UserDataExportDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.lang.reflect.Field;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserDataExportService Unit Tests")
class UserDataExportServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserIdentityRepository userIdentityRepository;
    @Mock
    private UserStatsRepository userStatsRepository;
    @Mock
    private UserBadgeRepository userBadgeRepository;
    @Mock
    private ExerciseSessionRepository exerciseSessionRepository;
    @Mock
    private ExerciseAttemptRepository exerciseAttemptRepository;
    @Mock
    private UserArticleProgressRepository articleProgressRepository;
    @Mock
    private ArticleRepository articleRepository;
    @Mock
    private UserSkillMasteryRepository skillMasteryRepository;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private UserDataExportService userDataExportService;

    private User testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        testUser = new User();
        testUser.setId(userId);
        testUser.setEmail("test@example.com");
        testUser.setDisplayName("Test User");
        testUser.setRole(Role.USER);
        testUser.setSkillLevel(2);
        testUser.setPreferredLanguage("en");
    }

    @Nested
    @DisplayName("exportUserData tests")
    class ExportUserDataTests {

        @Test
        @DisplayName("Should export complete user data")
        void shouldExportCompleteUserData() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(userIdentityRepository.findByUserId(userId)).thenReturn(List.of());
            when(userStatsRepository.findById(userId)).thenReturn(Optional.empty());
            when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());
            when(exerciseSessionRepository.findByUserIdOrderByStartedAtDesc(eq(userId), any(Pageable.class)))
                    .thenReturn(Page.empty());
            when(articleProgressRepository.findByUserId(userId)).thenReturn(List.of());
            when(skillMasteryRepository.findByUserId(userId)).thenReturn(List.of());

            UserDataExportDto result = userDataExportService.exportUserData(userId);

            assertNotNull(result);
            assertNotNull(result.metadata());
            assertEquals("1.0", result.metadata().exportVersion());
            assertEquals("Memorio", result.metadata().dataController());

            assertNotNull(result.account());
            assertEquals(userId, result.account().userId());
            assertEquals("test@example.com", result.account().email());
        }

        @Test
        @DisplayName("Should throw exception for non-existent user")
        void shouldThrowExceptionForNonExistentUser() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class, () ->
                    userDataExportService.exportUserData(userId));
        }

        @Test
        @DisplayName("Should export user with OAuth identities")
        void shouldExportUserWithOAuthIdentities() throws Exception {
            UserIdentity googleIdentity = new UserIdentity();
            setPrivateField(googleIdentity, "id", UUID.randomUUID());
            googleIdentity.setProvider("GOOGLE");
            googleIdentity.setProviderUserId("google-123");
            setPrivateField(googleIdentity, "createdAt", OffsetDateTime.now());

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(userIdentityRepository.findByUserId(userId)).thenReturn(List.of(googleIdentity));
            when(userStatsRepository.findById(userId)).thenReturn(Optional.empty());
            when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());
            when(exerciseSessionRepository.findByUserIdOrderByStartedAtDesc(eq(userId), any(Pageable.class)))
                    .thenReturn(Page.empty());
            when(articleProgressRepository.findByUserId(userId)).thenReturn(List.of());
            when(skillMasteryRepository.findByUserId(userId)).thenReturn(List.of());

            UserDataExportDto result = userDataExportService.exportUserData(userId);

            assertEquals(1, result.authProviders().size());
            assertEquals("GOOGLE", result.authProviders().get(0).provider());
        }

        @Test
        @DisplayName("Should export user gamification data with stats")
        void shouldExportUserGamificationDataWithStats() throws Exception {
            UserStats stats = new UserStats(userId);
            setPrivateField(stats, "totalPoints", 1500L);
            setPrivateField(stats, "totalAttempts", 100L);
            setPrivateField(stats, "totalCorrect", 80L);

            UserBadge badge = new UserBadge(UUID.randomUUID(), userId, "FIRST_ATTEMPT", OffsetDateTime.now());

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(userIdentityRepository.findByUserId(userId)).thenReturn(List.of());
            when(userStatsRepository.findById(userId)).thenReturn(Optional.of(stats));
            when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of(badge));
            when(exerciseSessionRepository.findByUserIdOrderByStartedAtDesc(eq(userId), any(Pageable.class)))
                    .thenReturn(Page.empty());
            when(articleProgressRepository.findByUserId(userId)).thenReturn(List.of());
            when(skillMasteryRepository.findByUserId(userId)).thenReturn(List.of());

            UserDataExportDto result = userDataExportService.exportUserData(userId);

            assertEquals(1500L, result.gamification().totalPoints());
            assertEquals(100L, result.gamification().totalAttempts());
            assertEquals(80L, result.gamification().totalCorrect());
            assertEquals(80.0, result.gamification().overallAccuracy(), 0.01);
            assertEquals(1, result.gamification().badges().size());
            assertEquals("FIRST_ATTEMPT", result.gamification().badges().get(0).code());
            assertEquals("First Steps", result.gamification().badges().get(0).name());
        }

        @Test
        @DisplayName("Should export user exercise history")
        void shouldExportUserExerciseHistory() throws Exception {
            UUID sessionId = UUID.randomUUID();
            ExerciseSession session = new ExerciseSession(sessionId, userId, ExerciseType.WORD_LINKING, OffsetDateTime.now().minusHours(1));
            session.markFinished(OffsetDateTime.now());

            Page<ExerciseSession> sessionPage = new PageImpl<>(List.of(session));

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(userIdentityRepository.findByUserId(userId)).thenReturn(List.of());
            when(userStatsRepository.findById(userId)).thenReturn(Optional.empty());
            when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());
            when(exerciseSessionRepository.findByUserIdOrderByStartedAtDesc(eq(userId), any(Pageable.class)))
                    .thenReturn(sessionPage);
            when(exerciseAttemptRepository.findBySessionId(sessionId)).thenReturn(List.of());
            when(articleProgressRepository.findByUserId(userId)).thenReturn(List.of());
            when(skillMasteryRepository.findByUserId(userId)).thenReturn(List.of());

            UserDataExportDto result = userDataExportService.exportUserData(userId);

            assertEquals(1, result.exerciseHistory().size());
            assertEquals("WORD_LINKING", result.exerciseHistory().get(0).exerciseType());
        }

        @Test
        @DisplayName("Should export user learning progress")
        void shouldExportUserLearningProgress() {
            UUID articleId = UUID.randomUUID();
            UserArticleProgress progress = new UserArticleProgress(
                    userId, articleId,
                    true, OffsetDateTime.now(), true, 100, 1, OffsetDateTime.now()
            );

            Article article = new Article(
                    articleId, "test-article", "Test Article", null,
                    TechniqueCategory.METHOD_OF_LOCI, 1, "# Content",
                    null, null, "Author", 5, 1, 1,
                    false, true, "en", null, null
            );

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(userIdentityRepository.findByUserId(userId)).thenReturn(List.of());
            when(userStatsRepository.findById(userId)).thenReturn(Optional.empty());
            when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());
            when(exerciseSessionRepository.findByUserIdOrderByStartedAtDesc(eq(userId), any(Pageable.class)))
                    .thenReturn(Page.empty());
            when(articleProgressRepository.findByUserId(userId)).thenReturn(List.of(progress));
            when(articleRepository.findById(articleId)).thenReturn(Optional.of(article));
            when(skillMasteryRepository.findByUserId(userId)).thenReturn(List.of());

            UserDataExportDto result = userDataExportService.exportUserData(userId);

            assertEquals(1, result.learningProgress().size());
            assertEquals("Test Article", result.learningProgress().get(0).articleTitle());
            assertEquals("test-article", result.learningProgress().get(0).articleSlug());
            assertTrue(result.learningProgress().get(0).hasRead());
            assertEquals(100, result.learningProgress().get(0).quizScore());
        }

        @Test
        @DisplayName("Should handle missing article in progress")
        void shouldHandleMissingArticleInProgress() {
            UUID articleId = UUID.randomUUID();
            UserArticleProgress progress = new UserArticleProgress(
                    userId, articleId,
                    true, OffsetDateTime.now(), false, null, 0, null
            );

            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(userIdentityRepository.findByUserId(userId)).thenReturn(List.of());
            when(userStatsRepository.findById(userId)).thenReturn(Optional.empty());
            when(userBadgeRepository.findByUserId(userId)).thenReturn(List.of());
            when(exerciseSessionRepository.findByUserIdOrderByStartedAtDesc(eq(userId), any(Pageable.class)))
                    .thenReturn(Page.empty());
            when(articleProgressRepository.findByUserId(userId)).thenReturn(List.of(progress));
            when(articleRepository.findById(articleId)).thenReturn(Optional.empty());
            when(skillMasteryRepository.findByUserId(userId)).thenReturn(List.of());

            UserDataExportDto result = userDataExportService.exportUserData(userId);

            assertEquals(1, result.learningProgress().size());
            assertEquals("Unknown Article", result.learningProgress().get(0).articleTitle());
            assertEquals("unknown", result.learningProgress().get(0).articleSlug());
        }
    }

    @Nested
    @DisplayName("deleteUserAccount tests")
    class DeleteUserAccountTests {

        @Test
        @DisplayName("Should delete user account")
        void shouldDeleteUserAccount() {
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

            userDataExportService.deleteUserAccount(userId);

            verify(userRepository).delete(testUser);
            verify(userRepository).flush();
        }

        @Test
        @DisplayName("Should throw exception for non-existent user")
        void shouldThrowExceptionForNonExistentUser() {
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThrows(IllegalArgumentException.class, () ->
                    userDataExportService.deleteUserAccount(userId));

            verify(userRepository, never()).delete(any());
        }
    }

    private void setPrivateField(Object obj, String fieldName, Object value) throws Exception {
        Field field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(obj, value);
    }
}
