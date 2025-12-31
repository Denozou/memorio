package com.memorio.backend.exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;
import java.util.List;
public interface ExerciseAttemptRepository extends JpaRepository<ExerciseAttempt, UUID>{
    Optional<ExerciseAttempt> findFirstBySessionId(UUID sessionId);
    List<ExerciseAttempt> findBySessionId(UUID sessionId);
    List<ExerciseAttempt> findAllBySessionId(UUID sessionId);
    long countBySessionId(UUID sessionId);
    //ExerciseAttempt findFirstBySessionIdOrderByCreatedAtDesc(UUID sessionId);
    interface AttemptSummary {
        Integer getTotal();
        Integer getCorrect();
        Double getAccuracy();
    }
    AttemptSummary findFirstBySessionIdOrderByCreatedAtDesc(UUID sessionId);

    interface SessionAttemptCount{
        UUID getSessionId();
        Long getAttemptCount();
    }
    @Query("""
           SELECT a.sessionId as sessionId, COUNT(a) AS attemptCount
           FROM ExerciseAttempt a
           WHERE a.sessionId IN :sessionIds
           Group BY a.sessionId
           """)
    List<SessionAttemptCount>countBySessionIds(@Param("sessionIds") List<UUID> sessionIds);

    interface SessionLastAttempt{
        UUID getSessionId();
        Integer getTotal();
        Integer getCorrect();
        Double getAccuracy();
    }
    @Query(value = """
           SELECT DISTINCT ON (session_id) session_id AS sessionId,
           total,
           correct,
           accuracy
           FROM exercise_attempts
           WHERE session_id IN (:sessionIds)
           ORDER BY session_id, created_at DESC
           """, nativeQuery = true)
    List<SessionLastAttempt> findLastAttemptsBySessionIds(@Param("sessionIds") List<UUID> sessionIds);

    // Count perfect scores (accuracy = 1.0) for a user's sessions
    @Query(value = """
           SELECT COUNT(*) FROM exercise_attempts a
           JOIN exercise_sessions s ON a.session_id = s.id
           WHERE s.user_id = :userId AND a.accuracy = 1.0
           """, nativeQuery = true)
    long countPerfectScoresByUserId(@Param("userId") UUID userId);
}
