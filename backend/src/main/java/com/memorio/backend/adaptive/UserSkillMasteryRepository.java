package com.memorio.backend.adaptive;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSkillMasteryRepository extends JpaRepository<UserSkillMastery, UUID>{
    Optional<UserSkillMastery> findByUserIdAndSkillTypeAndConceptId(UUID userId, String skillType, String conceptId);

    List<UserSkillMastery> findByUserId(UUID userId);

    List<UserSkillMastery> findByUserIdAndSkillType(UUID userId, String skillType);

    @Query("SELECT s FROM UserSkillMastery s WHERE s.userId = :userId " +
            "AND s.nextReviewAt IS NOT NULL AND s.nextReviewAt <= CURRENT_TIMESTAMP " +
            "ORDER BY s.nextReviewAt ASC")
    List<UserSkillMastery> findSkillDueForReview(@Param("userId")UUID userId);

    @Query("SELECT s FROM UserSkillMastery s WHERE s.userId = :userId " +
            "AND s.probabilityKnown >= 0.95")
    List<UserSkillMastery> findMasteredSkills(@Param("userId") UUID userId);

    @Query("SELECT s FROM UserSkillMastery s WHERE s.userId = :userId " +
            "AND s.probabilityKnown < 0.7 ORDER BY s.probabilityKnown ASC")
    List<UserSkillMastery> findSkillsNeedingPractice(@Param("userId") UUID userId);

    @Query("SELECT COUNT(s) FROM UserSkillMastery s WHERE s.userId = :userId " +
            "AND s.probabilityKnown >= 0.95")
    long countMasteredSkills(@Param("userid") UUID userId);
}
