package com.memorio.backend.exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExerciseSessionRepository extends JpaRepository<ExerciseSession, UUID>{
    Optional<ExerciseSession> findByIdAndUserId(UUID id, UUID userId);
    Page<ExerciseSession> findByUserIdOrderByStartedAtDesc(UUID userId, Pageable pageable);

}
