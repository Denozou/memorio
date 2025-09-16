package com.memorio.backend.exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface ExerciseAttemptRepository extends JpaRepository<ExerciseAttempt, UUID>{
    Optional<ExerciseAttempt> findBySessionId(UUID sessionId);
    long countBySessionId(UUID sessionId);
    //ExerciseAttempt findFirstBySessionIdOrderByCreatedAtDesc(UUID sessionId);
    interface AttemptSummary {
        Integer getTotal();
        Integer getCorrect();
        Double getAccuracy();
    }
    AttemptSummary findFirstBySessionIdOrderByCreatedAtDesc(UUID sessionId);

}
