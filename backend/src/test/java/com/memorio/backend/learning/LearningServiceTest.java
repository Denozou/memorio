package com.memorio.backend.learning;

import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.user.Role;
import com.memorio.backend.user.User;
import com.memorio.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LearningService Unit Tests")
class LearningServiceTest {

    @Mock
    private ArticleRepository articleRepo;

    @Mock
    private UserArticleProgressRepository progressRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private ArticleCacheService cacheService;

    @InjectMocks
    private LearningService learningService;

    private User testUser;
    private User adminUser;
    private Article testArticle;
    private Article introArticle;
    private UserArticleProgress testProgress;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setRole(Role.USER);
        testUser.setPreferredLanguage("en");

        adminUser = new User();
        adminUser.setId(UUID.randomUUID());
        adminUser.setEmail("admin@example.com");
        adminUser.setRole(Role.ADMIN);

        testArticle = new Article(
                UUID.randomUUID(), "test-article", "Test Article", "Subtitle",
                TechniqueCategory.METHOD_OF_LOCI, 1, "# Content",
                null, null, "Author", 5, 1, 2,
                false, true, "en", OffsetDateTime.now(), OffsetDateTime.now()
        );

        introArticle = new Article(
                UUID.randomUUID(), "intro-article", "Intro Article", "Intro Subtitle",
                TechniqueCategory.METHOD_OF_LOCI, 1, "# Intro",
                null, null, "Author", 3, 1, 1,
                true, true, "en", OffsetDateTime.now(), OffsetDateTime.now()
        );

        testProgress = new UserArticleProgress(
                testUser.getId(), testArticle.getId(),
                false, null, false, null, 0, null
        );
    }

    @Nested
    @DisplayName("getAccessibleArticles tests")
    class GetAccessibleArticlesTests {

        @Test
        @DisplayName("Should return intro articles for anonymous users")
        void shouldReturnIntroArticlesForAnonymousUsers() {
            when(articleRepo.findAllIntroArticlesByLanguage("en"))
                    .thenReturn(List.of(introArticle));

            List<Article> result = learningService.getAccessibleArticles(null);

            assertEquals(1, result.size());
            assertEquals(introArticle, result.get(0));
            verify(articleRepo).findAllIntroArticlesByLanguage("en");
        }

        @Test
        @DisplayName("Should return all articles for admin users")
        void shouldReturnAllArticlesForAdminUsers() {
            when(userRepo.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
            when(articleRepo.findAllByOrderByTechniqueCategoryAscSequenceInCategoryAsc())
                    .thenReturn(List.of(introArticle, testArticle));

            List<Article> result = learningService.getAccessibleArticles(adminUser.getId());

            assertEquals(2, result.size());
            verify(articleRepo).findAllByOrderByTechniqueCategoryAscSequenceInCategoryAsc();
        }

        @Test
        @DisplayName("Should return published articles in user's language")
        void shouldReturnPublishedArticlesInUserLanguage() {
            when(userRepo.findById(testUser.getId())).thenReturn(Optional.of(testUser));
            when(articleRepo.findAllPublishedByLanguage("en"))
                    .thenReturn(List.of(testArticle));

            List<Article> result = learningService.getAccessibleArticles(testUser.getId());

            assertEquals(1, result.size());
            verify(articleRepo).findAllPublishedByLanguage("en");
        }

        @Test
        @DisplayName("Should throw NotFoundException for non-existent user")
        void shouldThrowNotFoundForNonExistentUser() {
            UUID fakeUserId = UUID.randomUUID();
            when(userRepo.findById(fakeUserId)).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () ->
                    learningService.getAccessibleArticles(fakeUserId));
        }

        @Test
        @DisplayName("Should use default language when user has no preference")
        void shouldUseDefaultLanguageWhenNoPreference() {
            User userWithoutLang = new User();
            userWithoutLang.setId(UUID.randomUUID());
            userWithoutLang.setRole(Role.USER);
            userWithoutLang.setPreferredLanguage(null);

            when(userRepo.findById(userWithoutLang.getId())).thenReturn(Optional.of(userWithoutLang));
            when(articleRepo.findAllPublishedByLanguage("en")).thenReturn(List.of());

            learningService.getAccessibleArticles(userWithoutLang.getId());

            verify(articleRepo).findAllPublishedByLanguage("en");
        }
    }

    @Nested
    @DisplayName("getArticleBySlug tests")
    class GetArticleBySlugTests {

        @Test
        @DisplayName("Should return article for admin regardless of publish status")
        void shouldReturnArticleForAdminRegardlessOfPublishStatus() {
            Article unpublishedArticle = new Article(
                    UUID.randomUUID(), "unpublished", "Unpublished", null,
                    TechniqueCategory.STORY_METHOD, 1, "# Content",
                    null, null, "Author", 5, 1, 1,
                    false, false, "en", null, null
            );

            when(articleRepo.findBySlug("unpublished")).thenReturn(Optional.of(unpublishedArticle));
            when(userRepo.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));

            Article result = learningService.getArticleBySlug("unpublished", adminUser.getId());

            assertEquals(unpublishedArticle, result);
        }

        @Test
        @DisplayName("Should throw NotFoundException for unpublished article when not admin")
        void shouldThrowNotFoundForUnpublishedArticle() {
            Article unpublishedArticle = new Article(
                    UUID.randomUUID(), "unpublished", "Unpublished", null,
                    TechniqueCategory.STORY_METHOD, 1, "# Content",
                    null, null, "Author", 5, 1, 1,
                    false, false, "en", null, null
            );

            when(articleRepo.findBySlug("unpublished")).thenReturn(Optional.of(unpublishedArticle));
            when(userRepo.findById(testUser.getId())).thenReturn(Optional.of(testUser));

            assertThrows(NotFoundException.class, () ->
                    learningService.getArticleBySlug("unpublished", testUser.getId()));
        }

        @Test
        @DisplayName("Should throw NotFoundException for non-existent article")
        void shouldThrowNotFoundForNonExistentArticle() {
            when(articleRepo.findBySlug("non-existent")).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () ->
                    learningService.getArticleBySlug("non-existent", null));
        }

        @Test
        @DisplayName("Should throw IllegalStateException for wrong language")
        void shouldThrowForWrongLanguage() {
            Article polishArticle = new Article(
                    UUID.randomUUID(), "polish-article", "Polish Article", null,
                    TechniqueCategory.STORY_METHOD, 1, "# Tresc",
                    null, null, "Author", 5, 1, 1,
                    true, true, "pl", null, null
            );

            when(articleRepo.findBySlug("polish-article")).thenReturn(Optional.of(polishArticle));
            when(userRepo.findById(testUser.getId())).thenReturn(Optional.of(testUser));

            assertThrows(IllegalStateException.class, () ->
                    learningService.getArticleBySlug("polish-article", testUser.getId()));
        }

        @Test
        @DisplayName("Should allow anonymous access to intro articles in default language")
        void shouldAllowAnonymousAccessToIntroArticles() {
            when(articleRepo.findBySlug("intro-article")).thenReturn(Optional.of(introArticle));

            Article result = learningService.getArticleBySlug("intro-article", null);

            assertEquals(introArticle, result);
        }

        @Test
        @DisplayName("Should throw IllegalStateException for anonymous non-intro access")
        void shouldThrowForAnonymousNonIntroAccess() {
            when(articleRepo.findBySlug("test-article")).thenReturn(Optional.of(testArticle));

            assertThrows(IllegalStateException.class, () ->
                    learningService.getArticleBySlug("test-article", null));
        }

        @Test
        @DisplayName("Should check article unlock status for logged-in users")
        void shouldCheckArticleUnlockStatus() {
            Article prevArticle = new Article(
                    UUID.randomUUID(), "prev-article", "Previous", null,
                    TechniqueCategory.METHOD_OF_LOCI, 1, "# Content",
                    null, null, "Author", 5, 1, 1,
                    true, true, "en", null, null
            );

            UserArticleProgress completedProgress = new UserArticleProgress(
                    testUser.getId(), prevArticle.getId(),
                    true, OffsetDateTime.now(), true, 100, 1, OffsetDateTime.now()
            );

            when(articleRepo.findBySlug("test-article")).thenReturn(Optional.of(testArticle));
            when(userRepo.findById(testUser.getId())).thenReturn(Optional.of(testUser));
            when(articleRepo.findByCategorySequenceAndLanguage(
                    TechniqueCategory.METHOD_OF_LOCI, 1, "en"))
                    .thenReturn(Optional.of(prevArticle));
            when(progressRepo.findByUserIdAndArticleId(testUser.getId(), prevArticle.getId()))
                    .thenReturn(Optional.of(completedProgress));

            Article result = learningService.getArticleBySlug("test-article", testUser.getId());

            assertEquals(testArticle, result);
        }

        @Test
        @DisplayName("Should throw IllegalStateException for locked article")
        void shouldThrowForLockedArticle() {
            Article prevArticle = new Article(
                    UUID.randomUUID(), "prev-article", "Previous", null,
                    TechniqueCategory.METHOD_OF_LOCI, 1, "# Content",
                    null, null, "Author", 5, 1, 1,
                    true, true, "en", null, null
            );

            when(articleRepo.findBySlug("test-article")).thenReturn(Optional.of(testArticle));
            when(userRepo.findById(testUser.getId())).thenReturn(Optional.of(testUser));
            when(articleRepo.findByCategorySequenceAndLanguage(
                    TechniqueCategory.METHOD_OF_LOCI, 1, "en"))
                    .thenReturn(Optional.of(prevArticle));
            when(progressRepo.findByUserIdAndArticleId(testUser.getId(), prevArticle.getId()))
                    .thenReturn(Optional.empty());

            assertThrows(IllegalStateException.class, () ->
                    learningService.getArticleBySlug("test-article", testUser.getId()));
        }
    }

    @Nested
    @DisplayName("getArticleByCategory tests")
    class GetArticleByCategoryTests {

        @Test
        @DisplayName("Should return articles for category in user's language")
        void shouldReturnArticlesForCategoryInUserLanguage() {
            when(userRepo.findById(testUser.getId())).thenReturn(Optional.of(testUser));
            when(articleRepo.findByTechniqueCategoryAndLanguage(TechniqueCategory.METHOD_OF_LOCI, "en"))
                    .thenReturn(List.of(testArticle));

            List<Article> result = learningService.getArticleByCategory(
                    TechniqueCategory.METHOD_OF_LOCI, testUser.getId());

            assertEquals(1, result.size());
            assertEquals(testArticle, result.get(0));
        }

        @Test
        @DisplayName("Should use default language for anonymous users")
        void shouldUseDefaultLanguageForAnonymous() {
            when(articleRepo.findByTechniqueCategoryAndLanguage(TechniqueCategory.STORY_METHOD, "en"))
                    .thenReturn(List.of());

            learningService.getArticleByCategory(TechniqueCategory.STORY_METHOD, null);

            verify(articleRepo).findByTechniqueCategoryAndLanguage(TechniqueCategory.STORY_METHOD, "en");
        }
    }

    @Nested
    @DisplayName("markArticleAsRead tests")
    class MarkArticleAsReadTests {

        @Test
        @DisplayName("Should mark article as read for first time")
        void shouldMarkArticleAsReadFirstTime() {
            when(articleRepo.findById(testArticle.getId())).thenReturn(Optional.of(testArticle));
            when(userRepo.findById(testUser.getId())).thenReturn(Optional.of(testUser));
            when(progressRepo.findByUserIdAndArticleId(testUser.getId(), testArticle.getId()))
                    .thenReturn(Optional.empty());
            when(progressRepo.save(any(UserArticleProgress.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            learningService.markArticleAsRead(testArticle.getId(), testUser.getId());

            verify(progressRepo, times(2)).save(any(UserArticleProgress.class));
            verify(cacheService).evictAllUserProgressForArticle(testUser.getId(), testArticle.getId());
        }

        @Test
        @DisplayName("Should not update already read article")
        void shouldNotUpdateAlreadyReadArticle() {
            testProgress.setHasRead(true);
            testProgress.setFirstReadAt(OffsetDateTime.now());

            when(articleRepo.findById(testArticle.getId())).thenReturn(Optional.of(testArticle));
            when(userRepo.findById(testUser.getId())).thenReturn(Optional.of(testUser));
            when(progressRepo.findByUserIdAndArticleId(testUser.getId(), testArticle.getId()))
                    .thenReturn(Optional.of(testProgress));

            learningService.markArticleAsRead(testArticle.getId(), testUser.getId());

            verify(progressRepo, never()).save(any());
            verify(cacheService, never()).evictAllUserProgressForArticle(any(), any());
        }

        @Test
        @DisplayName("Should throw NotFoundException for non-existent article")
        void shouldThrowForNonExistentArticle() {
            UUID fakeId = UUID.randomUUID();
            when(articleRepo.findById(fakeId)).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () ->
                    learningService.markArticleAsRead(fakeId, testUser.getId()));
        }

        @Test
        @DisplayName("Should throw IllegalStateException for unpublished article (non-admin)")
        void shouldThrowForUnpublishedArticleNonAdmin() {
            Article unpublished = new Article(
                    UUID.randomUUID(), "unpub", "Unpub", null,
                    TechniqueCategory.STORY_METHOD, 1, "# Content",
                    null, null, "Author", 5, 1, 1,
                    false, false, "en", null, null
            );

            when(articleRepo.findById(unpublished.getId())).thenReturn(Optional.of(unpublished));
            when(userRepo.findById(testUser.getId())).thenReturn(Optional.of(testUser));

            assertThrows(IllegalStateException.class, () ->
                    learningService.markArticleAsRead(unpublished.getId(), testUser.getId()));
        }

        @Test
        @DisplayName("Should allow admin to mark unpublished article as read")
        void shouldAllowAdminToMarkUnpublishedAsRead() {
            Article unpublished = new Article(
                    UUID.randomUUID(), "unpub", "Unpub", null,
                    TechniqueCategory.STORY_METHOD, 1, "# Content",
                    null, null, "Author", 5, 1, 1,
                    false, false, "en", null, null
            );

            when(articleRepo.findById(unpublished.getId())).thenReturn(Optional.of(unpublished));
            when(userRepo.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
            when(progressRepo.findByUserIdAndArticleId(adminUser.getId(), unpublished.getId()))
                    .thenReturn(Optional.empty());
            when(progressRepo.save(any(UserArticleProgress.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            learningService.markArticleAsRead(unpublished.getId(), adminUser.getId());

            verify(progressRepo, times(2)).save(any(UserArticleProgress.class));
        }
    }

    @Nested
    @DisplayName("getUserArticleProgress tests")
    class GetUserArticleProgressTests {

        @Test
        @DisplayName("Should return progress when exists")
        void shouldReturnProgressWhenExists() {
            when(progressRepo.findByUserIdAndArticleId(testUser.getId(), testArticle.getId()))
                    .thenReturn(Optional.of(testProgress));

            UserArticleProgress result = learningService.getUserArticleProgress(
                    testUser.getId(), testArticle.getId());

            assertNotNull(result);
            assertEquals(testProgress, result);
        }

        @Test
        @DisplayName("Should return null when no progress exists")
        void shouldReturnNullWhenNoProgress() {
            when(progressRepo.findByUserIdAndArticleId(testUser.getId(), testArticle.getId()))
                    .thenReturn(Optional.empty());

            UserArticleProgress result = learningService.getUserArticleProgress(
                    testUser.getId(), testArticle.getId());

            assertNull(result);
        }
    }

    @Nested
    @DisplayName("getUserProgress tests")
    class GetUserProgressTests {

        @Test
        @DisplayName("Should return all user progress records")
        void shouldReturnAllUserProgressRecords() {
            List<UserArticleProgress> progressList = List.of(testProgress);
            when(progressRepo.findByUserId(testUser.getId())).thenReturn(progressList);

            List<UserArticleProgress> result = learningService.getUserProgress(testUser.getId());

            assertEquals(1, result.size());
            verify(progressRepo).findByUserId(testUser.getId());
        }
    }

    @Nested
    @DisplayName("getCompletionPercentage tests")
    class GetCompletionPercentageTests {

        @Test
        @DisplayName("Should return completion percentage")
        void shouldReturnCompletionPercentage() {
            when(progressRepo.getCompletionPercentage(testUser.getId())).thenReturn(75.0);

            Double result = learningService.getCompletionPercentage(testUser.getId());

            assertEquals(75.0, result);
        }

        @Test
        @DisplayName("Should return 0 when no progress")
        void shouldReturnZeroWhenNoProgress() {
            when(progressRepo.getCompletionPercentage(testUser.getId())).thenReturn(null);

            Double result = learningService.getCompletionPercentage(testUser.getId());

            assertEquals(0.0, result);
        }
    }
}
