package com.memorio.backend.adaptive;

import com.memorio.backend.adaptive.dto.*;
import com.memorio.backend.common.security.AuthenticationUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/adaptive")
public class AdaptiveDifficultyController {

    private final AdaptiveDifficultyService adaptiveService;

    public AdaptiveDifficultyController(AdaptiveDifficultyService adaptiveService){
        this.adaptiveService = adaptiveService;
    }
    @GetMapping("/stats")
    public ResponseEntity<MasteryStatsDTO> getMasteryStats(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);

        AdaptiveDifficultyService.MasteryStats stats = adaptiveService.getMasteryStats(userId);

        MasteryStatsDTO dto = new MasteryStatsDTO(
                stats.totalSkills(),
                stats.masteredSkills(),
                stats.skillsDueForReview(),
                stats.averageMastery(),
                stats.skillsNeedingPractice()
        );
        return ResponseEntity.ok(dto);
    }
    @GetMapping("/skills/review")
    public ResponseEntity<List<SkillMasteryDTO>> getSkillDueForReview(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        List<UserSkillMastery> skills =  adaptiveService.getSkillsDueForReview(userId);
        List<SkillMasteryDTO> dtos = skills.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
    @GetMapping("/review-count")
    public ResponseEntity<ReviewCountDTO> getReviewCount(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        List<UserSkillMastery> skillsDue = adaptiveService.getSkillsDueForReview(userId);

        return ResponseEntity.ok(new ReviewCountDTO(skillsDue.size()));
    }
    @GetMapping("/skills/practice")
    public ResponseEntity<List<SkillMasteryDTO>> getSkillsNeedingPractice(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        List<UserSkillMastery> skills = adaptiveService.getSkillsNeedingPractice(userId);

        List<SkillMasteryDTO> dtos = skills.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
    @GetMapping("/skills/mastered")
    public ResponseEntity<List<SkillMasteryDTO>> getMasteredSkills(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);

        List<UserSkillMastery> skills = adaptiveService.getMasteredSkills(userId);
        List<SkillMasteryDTO> dtos = skills.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
    @GetMapping("/recommend/{skillType}")
    public ResponseEntity<RecommendationDTO> getRecommendedDifficulty(
            @PathVariable String skillType,
            Authentication auth) {
        UUID userId = AuthenticationUtil.extractUserId(auth);
        int recommendedLevel = adaptiveService.getRecommendedDifficulty(userId, skillType);

        return ResponseEntity.ok(new RecommendationDTO(skillType, recommendedLevel));
    }
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardDTO> getDashboard(Authentication auth) {
        UUID userId = AuthenticationUtil.extractUserId(auth);

        AdaptiveDifficultyService.MasteryStats stats = adaptiveService.getMasteryStats(userId);
        List<UserSkillMastery> reviewDue = adaptiveService.getSkillsDueForReview(userId);
        List<UserSkillMastery> needsPractice = adaptiveService.getSkillsNeedingPractice(userId);
        List<UserSkillMastery> mastered = adaptiveService.getMasteredSkills(userId);

        MasteryStatsDTO statsDTO = new MasteryStatsDTO(
                stats.totalSkills(),
                stats.masteredSkills(),
                stats.skillsDueForReview(),
                stats.averageMastery(),
                stats.skillsNeedingPractice()
        );

        DashboardDTO dashboard = new DashboardDTO(
                statsDTO,
                reviewDue.stream().map(this::toDTO).collect(Collectors.toList()),
                needsPractice.stream().map(this::toDTO).collect(Collectors.toList()),
                mastered.stream().map(this::toDTO).collect(Collectors.toList())
        );

        return ResponseEntity.ok(dashboard);
    }

    private SkillMasteryDTO toDTO(UserSkillMastery mastery) {
        return new SkillMasteryDTO(
                mastery.getId(),
                mastery.getSkillType(),
                mastery.getConceptId(),
                mastery.getProbabilityKnown(),
                mastery.getTotalAttempts(),
                mastery.getCorrectAttempts(),
                mastery.getAccuracyRate(),
                mastery.isMastered(),
                mastery.needsReview(),
                mastery.getNextReviewAt(),
                mastery.getLastAttemptAt(),
                mastery.getReviewIntervalDays(),
                mastery.getEaseFactor()
        );
    }
}
