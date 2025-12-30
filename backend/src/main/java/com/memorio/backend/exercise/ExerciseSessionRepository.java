package com.memorio.backend.exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExerciseSessionRepository extends JpaRepository<ExerciseSession, UUID>{
    Optional<ExerciseSession> findByIdAndUserId(UUID id, UUID userId);
    Page<ExerciseSession> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

    // Count completed sessions (finished_at is not null) for a user
    @Query("SELECT COUNT(s) FROM ExerciseSession s WHERE s.userId = :userId AND s.finishedAt IS NOT NULL")
    long countCompletedByUserId(@Param("userId") UUID userId);

    // Count completed sessions by type for a user
    @Query("SELECT COUNT(s) FROM ExerciseSession s WHERE s.userId = :userId AND s.type = :type AND s.finishedAt IS NOT NULL")
    long countCompletedByUserIdAndType(@Param("userId") UUID userId, @Param("type") ExerciseType type);
}
