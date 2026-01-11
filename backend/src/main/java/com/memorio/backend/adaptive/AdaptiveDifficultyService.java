package com.memorio.backend.adaptive;

import com.memorio.backend.user.User;
import com.memorio.backend.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AdaptiveDifficultyService {

    private final UserSkillMasteryRepository masteryRepo;
    private final SkillAttemptHistoryRepository historyRepo;
    private final UserRepository userRepo;

    private static final double RECALL_TASK_GUESS_RATE = 0.05;
    private static final double MULTIPLE_CHOICE_GUESS_RATE = 0.25;
    private static final double RECOGNITION_TASK_GUESS_RATE = 0.15;

    public AdaptiveDifficultyService(UserSkillMasteryRepository masteryRepo,
                                     SkillAttemptHistoryRepository historyRepo,
                                     UserRepository userRepo) {
        this.masteryRepo = masteryRepo;
        this.historyRepo = historyRepo;
        this.userRepo = userRepo;
    }

    public UserSkillMastery recordAttempt(UUID userId, String skillType, String conceptId,
                                          boolean wasCorrect, int difficultyLevel,
                                          UUID exerciseSessionId, Integer responseTimeMs) {
        UserSkillMastery mastery = masteryRepo
                .findByUserIdAndSkillTypeAndConceptId(userId, skillType, conceptId)
                .orElseGet(() -> {
                    UserSkillMastery newMastery = new UserSkillMastery(userId, skillType, conceptId);
                    newMastery.setProbabilityGuess(getGuessRateForSkillType(skillType));
                    return masteryRepo.save(newMastery);
                });

        Double hoursSinceLastPractice = null;
        if (mastery.getLastAttemptAt() != null) {
            Duration duration = Duration.between(mastery.getLastAttemptAt(), OffsetDateTime.now());
            hoursSinceLastPractice = duration.toMinutes() / 60.0;
        }

        double probabilityBefore = mastery.getProbabilityKnown();
        mastery.updateKnowledgeState(wasCorrect);

        int quality = calculateSpacedRepetitionQuality(wasCorrect, difficultyLevel);
        mastery.updateSpaceRepetition(quality);
        mastery = masteryRepo.save(mastery);

        User user = userRepo.findById(userId).orElse(null);
        SkillAttemptHistory history = new SkillAttemptHistory(
                userId, mastery.getId(), exerciseSessionId,
                skillType, difficultyLevel, wasCorrect
        );
        history.setResponseTimeMs(responseTimeMs);
        history.setTimeSinceLastPracticeHours(hoursSinceLastPractice);
        history.setUserSkillLevelAtTime(user != null ? user.getSkillLevel() : null);
        history.setProbabilityKnownBefore(probabilityBefore);
        history.setProbabilityKnownAfter(mastery.getProbabilityKnown());
        historyRepo.save(history);

        return mastery;
    }

    public int getRecommendedDifficulty(UUID userId, String skillType) {
        List<UserSkillMastery> masteries = masteryRepo.findByUserIdAndSkillType(userId, skillType);

        if (masteries.isEmpty()) {
            return 1;
        }

        double avgMastery = masteries.stream()
                .mapToDouble(UserSkillMastery::getProbabilityKnown)
                .average()
                .orElse(0.3);

        if (avgMastery < 0.3) return 1;
        if (avgMastery < 0.4) return 2;
        if (avgMastery < 0.5) return 3;
        if (avgMastery < 0.6) return 4;
        if (avgMastery < 0.7) return 5;
        if (avgMastery < 0.75) return 6;
        if (avgMastery < 0.8) return 7;
        if (avgMastery < 0.85) return 8;
        if (avgMastery < 0.92) return 9;
        return 10;
    }

    public List<UserSkillMastery> getSkillsDueForReview(UUID userId) {
        return masteryRepo.findSkillDueForReview(userId);
    }

    public List<UserSkillMastery> getSkillsNeedingPractice(UUID userId) {
        return masteryRepo.findSkillsNeedingPractice(userId);
    }

    public List<UserSkillMastery> getMasteredSkills(UUID userId) {
        return masteryRepo.findMasteredSkills(userId);
    }

    public MasteryStats getMasteryStats(UUID userId) {
        List<UserSkillMastery> allSkills = masteryRepo.findByUserId(userId);

        // Filter out QUIZ skills - only count main exercises
        List<UserSkillMastery> mainExerciseSkills = allSkills.stream()
                .filter(s -> !s.getSkillType().equals("QUIZ"))
                .toList();

        if (mainExerciseSkills.isEmpty()) {
            return new MasteryStats(0, 0, 0, 0.0, 0);
        }

        long masteredCount = mainExerciseSkills.stream()
                .filter(UserSkillMastery::isMastered)
                .count();

        long needsReviewCount = mainExerciseSkills.stream()
                .filter(UserSkillMastery::needsReview)
                .count();

        long needsPracticeCount = mainExerciseSkills.stream()
                .filter(s -> s.getProbabilityKnown() < 0.7)
                .count();

        double avgMastery = mainExerciseSkills.stream()
                .mapToDouble(UserSkillMastery::getProbabilityKnown)
                .average()
                .orElse(0.0);

        return new MasteryStats(
                mainExerciseSkills.size(),
                (int) masteredCount,
                (int) needsReviewCount,
                avgMastery,
                (int) needsPracticeCount
        );
    }

    public UserSkillMastery getSkillMastery(UUID userId, String skillType, String conceptId) {
        return masteryRepo.findByUserIdAndSkillTypeAndConceptId(userId, skillType, conceptId)
                .orElse(null);
    }

    private double getGuessRateForSkillType(String skillType) {
        return switch (skillType) {
            case "WORD_LINKING", "NUMBER_PEG" -> RECALL_TASK_GUESS_RATE;
            case "NAMES_FACES" -> RECOGNITION_TASK_GUESS_RATE;
            case "QUIZ" -> MULTIPLE_CHOICE_GUESS_RATE;
            default -> 0.15;
        };
    }

    private int calculateSpacedRepetitionQuality(boolean wasCorrect, int difficultyLevel) {
        if (!wasCorrect) {
            return 0;
        }

        if (difficultyLevel >= 8) return 5;
        if (difficultyLevel >= 6) return 4;
        if (difficultyLevel >= 4) return 3;
        return 3;
    }

    public record MasteryStats(
            int totalSkills,
            int masteredSkills,
            int skillsDueForReview,
            double averageMastery,
            int skillsNeedingPractice
    ) {}
}