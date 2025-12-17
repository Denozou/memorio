package com.memorio.backend.adaptive;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;


public interface SkillAttemptHistoryRepository extends JpaRepository<SkillAttemptHistory, UUID>{

    List<SkillAttemptHistory> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<SkillAttemptHistory> findBySkillMasteryIdOrderByCreatedAtDesc(UUID skillMasteryId);

    @Query("SELECT h FROM SkillAttemptHistory h WHERE h.userId = :userId " +
            "AND h.createdAt BETWEEN :startDate AND :endDate " +
            "ORDER BY h.createdAt DESC")
    List<SkillAttemptHistory> findAttemptsByDateRange(
            @Param("userId") UUID userId,
            @Param("startDate") OffsetDateTime startDate,
            @Param("endDate") OffsetDateTime endDate
    );
    @Query("SELECT AVG(CASE WHEN h.wasCorrect = true THEN 1.0 ELSE 0.0 END) " +
            "FROM SkillAttemptHistory h WHERE h.userId = :userId AND h.skillType = :skillType")
    Double calculateAverageAccuracy(@Param("userId") UUID userId,
                                    @Param("skillType") String skillType);
}
