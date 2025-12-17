-- Performance optimization for history endpoint
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_session_id
ON exercise_attempts(session_id);

-- Composite index for the "last attempt" query
CREATE INDEX IF NOT EXISTS idx_exercise_attempts_session_created
ON exercise_attempts(session_id, created_at DESC);