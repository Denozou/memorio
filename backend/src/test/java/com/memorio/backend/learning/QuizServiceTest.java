package com.memorio.backend.learning;

import com.memorio.backend.adaptive.AdaptiveDifficultyService;
import com.memorio.backend.common.error.NotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("QuizService Unit Tests")
class QuizServiceTest {

    @Mock
    private ArticleRepository articleRepo;

    @Mock
    private ArticleQuizRepository quizRepo;

    @Mock
    private QuizQuestionRepository questionRepo;

    @Mock
    private QuizQuestionOptionRepository optionRepo;

    @Mock
    private UserArticleProgressRepository progressRepo;

    @Mock
    private AdaptiveDifficultyService adaptiveService;

    @Mock
    private ArticleCacheService cacheService;

    @InjectMocks
    private QuizService quizService;

    private Article testArticle;
    private ArticleQuiz testQuiz;
    private QuizQuestion testQuestion1;
    private QuizQuestion testQuestion2;
    private QuizQuestionOption correctOption1;
    private QuizQuestionOption wrongOption1;
    private QuizQuestionOption correctOption2;
    private QuizQuestionOption wrongOption2;
    private UUID userId;

    @BeforeEach
    void setUp() throws Exception {
        userId = UUID.randomUUID();

        testArticle = new Article(
                UUID.randomUUID(), "test-article", "Test Article", "Subtitle",
                TechniqueCategory.METHOD_OF_LOCI, 1, "# Content",
                null, null, "Author", 5, 1, 1,
                false, true, "en", OffsetDateTime.now(), OffsetDateTime.now()
        );

        testQuiz = new ArticleQuiz(testArticle.getId(), "Test Quiz", 70);
        setPrivateField(testQuiz, "id", UUID.randomUUID());

        testQuestion1 = new QuizQuestion(
                testQuiz.getId(), "Question 1?", QuestionType.MULTIPLE_CHOICE, 1, "Explanation 1"
        );
        setPrivateField(testQuestion1, "id", UUID.randomUUID());

        testQuestion2 = new QuizQuestion(
                testQuiz.getId(), "Question 2?", QuestionType.MULTIPLE_CHOICE, 2, "Explanation 2"
        );
        setPrivateField(testQuestion2, "id", UUID.randomUUID());

        correctOption1 = new QuizQuestionOption(testQuestion1.getId(), "Correct Answer 1", true, 1);
        setPrivateField(correctOption1, "id", UUID.randomUUID());

        wrongOption1 = new QuizQuestionOption(testQuestion1.getId(), "Wrong Answer 1", false, 2);
        setPrivateField(wrongOption1, "id", UUID.randomUUID());

        correctOption2 = new QuizQuestionOption(testQuestion2.getId(), "Correct Answer 2", true, 1);
        setPrivateField(correctOption2, "id", UUID.randomUUID());

        wrongOption2 = new QuizQuestionOption(testQuestion2.getId(), "Wrong Answer 2", false, 2);
        setPrivateField(wrongOption2, "id", UUID.randomUUID());
    }

    private void setPrivateField(Object obj, String fieldName, Object value) throws Exception {
        Field field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(obj, value);
    }

    @Nested
    @DisplayName("getQuizByArticleSlug tests")
    class GetQuizByArticleSlugTests {

        @Test
        @DisplayName("Should return quiz with questions and options")
        void shouldReturnQuizWithQuestionsAndOptions() {
            when(articleRepo.findBySlug("test-article")).thenReturn(Optional.of(testArticle));
            when(quizRepo.findByArticleId(testArticle.getId())).thenReturn(Optional.of(testQuiz));
            when(questionRepo.findByQuizIdOrderByDisplayOrder(testQuiz.getId()))
                    .thenReturn(List.of(testQuestion1, testQuestion2));
            when(optionRepo.findByQuestionIdOrderByDisplayOrder(testQuestion1.getId()))
                    .thenReturn(List.of(correctOption1, wrongOption1));
            when(optionRepo.findByQuestionIdOrderByDisplayOrder(testQuestion2.getId()))
                    .thenReturn(List.of(correctOption2, wrongOption2));

            QuizService.QuizWithQuestions result = quizService.getQuizByArticleSlug("test-article");

            assertNotNull(result);
            assertEquals(testQuiz, result.quiz());
            assertEquals(2, result.questions().size());
            assertEquals(2, result.questions().get(0).options().size());
            assertEquals(2, result.questions().get(1).options().size());
        }

        @Test
        @DisplayName("Should throw NotFoundException for non-existent article")
        void shouldThrowNotFoundForNonExistentArticle() {
            when(articleRepo.findBySlug("non-existent")).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () ->
                    quizService.getQuizByArticleSlug("non-existent"));
        }

        @Test
        @DisplayName("Should throw NotFoundException when quiz not found for article")
        void shouldThrowNotFoundWhenQuizNotFound() {
            when(articleRepo.findBySlug("test-article")).thenReturn(Optional.of(testArticle));
            when(quizRepo.findByArticleId(testArticle.getId())).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () ->
                    quizService.getQuizByArticleSlug("test-article"));
        }
    }

    @Nested
    @DisplayName("submitQuiz tests")
    class SubmitQuizTests {

        @Test
        @DisplayName("Should return passing result for all correct answers")
        void shouldReturnPassingResultForAllCorrectAnswers() {
            when(quizRepo.findById(testQuiz.getId())).thenReturn(Optional.of(testQuiz));
            when(questionRepo.findByQuizIdOrderByDisplayOrder(testQuiz.getId()))
                    .thenReturn(List.of(testQuestion1, testQuestion2));
            when(optionRepo.findById(correctOption1.getId())).thenReturn(Optional.of(correctOption1));
            when(optionRepo.findById(correctOption2.getId())).thenReturn(Optional.of(correctOption2));
            when(progressRepo.findByUserIdAndArticleId(userId, testArticle.getId()))
                    .thenReturn(Optional.empty());
            when(progressRepo.save(any(UserArticleProgress.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<UUID> answers = List.of(correctOption1.getId(), correctOption2.getId());
            QuizService.QuizResult result = quizService.submitQuiz(testQuiz.getId(), userId, answers);

            assertEquals(testQuiz.getId(), result.quizId());
            assertEquals(2, result.totalQuestions());
            assertEquals(2, result.correctAnswers());
            assertEquals(100, result.percentage());
            assertTrue(result.passed());
            assertEquals(70, result.passingScore());

            verify(adaptiveService).recordAttempt(eq(userId), eq("QUIZ"), anyString(), eq(true), eq(1), isNull());
        }

        @Test
        @DisplayName("Should return failing result for insufficient correct answers")
        void shouldReturnFailingResultForInsufficientCorrectAnswers() {
            when(quizRepo.findById(testQuiz.getId())).thenReturn(Optional.of(testQuiz));
            when(questionRepo.findByQuizIdOrderByDisplayOrder(testQuiz.getId()))
                    .thenReturn(List.of(testQuestion1, testQuestion2));
            when(optionRepo.findById(correctOption1.getId())).thenReturn(Optional.of(correctOption1));
            when(optionRepo.findById(wrongOption2.getId())).thenReturn(Optional.of(wrongOption2));
            when(progressRepo.findByUserIdAndArticleId(userId, testArticle.getId()))
                    .thenReturn(Optional.empty());
            when(progressRepo.save(any(UserArticleProgress.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<UUID> answers = List.of(correctOption1.getId(), wrongOption2.getId());
            QuizService.QuizResult result = quizService.submitQuiz(testQuiz.getId(), userId, answers);

            assertEquals(2, result.totalQuestions());
            assertEquals(1, result.correctAnswers());
            assertEquals(50, result.percentage());
            assertFalse(result.passed());

            verify(adaptiveService).recordAttempt(eq(userId), eq("QUIZ"), anyString(), eq(false), eq(1), isNull());
        }

        @Test
        @DisplayName("Should throw NotFoundException for non-existent quiz")
        void shouldThrowNotFoundForNonExistentQuiz() {
            UUID fakeQuizId = UUID.randomUUID();
            when(quizRepo.findById(fakeQuizId)).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () ->
                    quizService.submitQuiz(fakeQuizId, userId, List.of()));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException for wrong answer count")
        void shouldThrowForWrongAnswerCount() {
            when(quizRepo.findById(testQuiz.getId())).thenReturn(Optional.of(testQuiz));
            when(questionRepo.findByQuizIdOrderByDisplayOrder(testQuiz.getId()))
                    .thenReturn(List.of(testQuestion1, testQuestion2));

            List<UUID> answers = List.of(correctOption1.getId()); // Only 1 answer for 2 questions

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                    quizService.submitQuiz(testQuiz.getId(), userId, answers));

            assertTrue(exception.getMessage().contains("Expected 2 answers"));
        }

        @Test
        @DisplayName("Should throw NotFoundException for non-existent option")
        void shouldThrowNotFoundForNonExistentOption() {
            UUID fakeOptionId = UUID.randomUUID();
            when(quizRepo.findById(testQuiz.getId())).thenReturn(Optional.of(testQuiz));
            when(questionRepo.findByQuizIdOrderByDisplayOrder(testQuiz.getId()))
                    .thenReturn(List.of(testQuestion1, testQuestion2));
            when(optionRepo.findById(fakeOptionId)).thenReturn(Optional.empty());

            List<UUID> answers = List.of(fakeOptionId, correctOption2.getId());

            assertThrows(NotFoundException.class, () ->
                    quizService.submitQuiz(testQuiz.getId(), userId, answers));
        }

        @Test
        @DisplayName("Should throw IllegalArgumentException when option doesn't belong to question")
        void shouldThrowWhenOptionDoesntBelongToQuestion() {
            when(quizRepo.findById(testQuiz.getId())).thenReturn(Optional.of(testQuiz));
            when(questionRepo.findByQuizIdOrderByDisplayOrder(testQuiz.getId()))
                    .thenReturn(List.of(testQuestion1, testQuestion2));
            // Return option2 for question1 (wrong question)
            when(optionRepo.findById(correctOption2.getId())).thenReturn(Optional.of(correctOption2));

            List<UUID> answers = List.of(correctOption2.getId(), correctOption1.getId());

            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () ->
                    quizService.submitQuiz(testQuiz.getId(), userId, answers));

            assertTrue(exception.getMessage().contains("does not belong to question"));
        }

        @Test
        @DisplayName("Should update existing progress with higher score")
        void shouldUpdateExistingProgressWithHigherScore() {
            UserArticleProgress existingProgress = new UserArticleProgress(
                    userId, testArticle.getId(),
                    true, OffsetDateTime.now(), false, 30, 1, null
            );

            when(quizRepo.findById(testQuiz.getId())).thenReturn(Optional.of(testQuiz));
            when(questionRepo.findByQuizIdOrderByDisplayOrder(testQuiz.getId()))
                    .thenReturn(List.of(testQuestion1, testQuestion2));
            when(optionRepo.findById(correctOption1.getId())).thenReturn(Optional.of(correctOption1));
            when(optionRepo.findById(correctOption2.getId())).thenReturn(Optional.of(correctOption2));
            when(progressRepo.findByUserIdAndArticleId(userId, testArticle.getId()))
                    .thenReturn(Optional.of(existingProgress));
            when(progressRepo.save(any(UserArticleProgress.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<UUID> answers = List.of(correctOption1.getId(), correctOption2.getId());
            quizService.submitQuiz(testQuiz.getId(), userId, answers);

            verify(progressRepo).save(argThat(progress ->
                    progress.getQuizScore() == 100 &&
                    progress.getQuizAttempts() == 2 &&
                    progress.getQuizCompleted()
            ));
            verify(cacheService).evictAllUserProgressForArticle(userId, testArticle.getId());
        }

        @Test
        @DisplayName("Should not replace existing higher score with lower score")
        void shouldNotReplaceHigherScoreWithLower() {
            UserArticleProgress existingProgress = new UserArticleProgress(
                    userId, testArticle.getId(),
                    true, OffsetDateTime.now(), true, 100, 1, OffsetDateTime.now()
            );

            when(quizRepo.findById(testQuiz.getId())).thenReturn(Optional.of(testQuiz));
            when(questionRepo.findByQuizIdOrderByDisplayOrder(testQuiz.getId()))
                    .thenReturn(List.of(testQuestion1, testQuestion2));
            when(optionRepo.findById(wrongOption1.getId())).thenReturn(Optional.of(wrongOption1));
            when(optionRepo.findById(wrongOption2.getId())).thenReturn(Optional.of(wrongOption2));
            when(progressRepo.findByUserIdAndArticleId(userId, testArticle.getId()))
                    .thenReturn(Optional.of(existingProgress));
            when(progressRepo.save(any(UserArticleProgress.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<UUID> answers = List.of(wrongOption1.getId(), wrongOption2.getId());
            quizService.submitQuiz(testQuiz.getId(), userId, answers);

            verify(progressRepo).save(argThat(progress ->
                    progress.getQuizScore() == 100 && // Score should remain 100
                    progress.getQuizAttempts() == 2
            ));
        }

        @Test
        @DisplayName("Should keep quizCompleted true once passed")
        void shouldKeepQuizCompletedTrueOncePassed() {
            UserArticleProgress existingProgress = new UserArticleProgress(
                    userId, testArticle.getId(),
                    true, OffsetDateTime.now(), true, 80, 1, OffsetDateTime.now()
            );

            when(quizRepo.findById(testQuiz.getId())).thenReturn(Optional.of(testQuiz));
            when(questionRepo.findByQuizIdOrderByDisplayOrder(testQuiz.getId()))
                    .thenReturn(List.of(testQuestion1, testQuestion2));
            when(optionRepo.findById(wrongOption1.getId())).thenReturn(Optional.of(wrongOption1));
            when(optionRepo.findById(wrongOption2.getId())).thenReturn(Optional.of(wrongOption2));
            when(progressRepo.findByUserIdAndArticleId(userId, testArticle.getId()))
                    .thenReturn(Optional.of(existingProgress));
            when(progressRepo.save(any(UserArticleProgress.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<UUID> answers = List.of(wrongOption1.getId(), wrongOption2.getId());
            quizService.submitQuiz(testQuiz.getId(), userId, answers);

            verify(progressRepo).save(argThat(UserArticleProgress::getQuizCompleted));
        }

        @Test
        @DisplayName("Should create new progress for first attempt")
        void shouldCreateNewProgressForFirstAttempt() {
            when(quizRepo.findById(testQuiz.getId())).thenReturn(Optional.of(testQuiz));
            when(questionRepo.findByQuizIdOrderByDisplayOrder(testQuiz.getId()))
                    .thenReturn(List.of(testQuestion1, testQuestion2));
            when(optionRepo.findById(correctOption1.getId())).thenReturn(Optional.of(correctOption1));
            when(optionRepo.findById(correctOption2.getId())).thenReturn(Optional.of(correctOption2));
            when(progressRepo.findByUserIdAndArticleId(userId, testArticle.getId()))
                    .thenReturn(Optional.empty());
            when(progressRepo.save(any(UserArticleProgress.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<UUID> answers = List.of(correctOption1.getId(), correctOption2.getId());
            quizService.submitQuiz(testQuiz.getId(), userId, answers);

            // First save creates new progress, second save updates it
            verify(progressRepo, times(2)).save(any(UserArticleProgress.class));
        }
    }
}
