-- ============================================================================
-- ADAPTIVE DIFFICULTY ENGINE
-- Bayesian Knowledge Tracing (BKT) + Spaced Repetition System
-- ============================================================================

-- Track knowledge state for each skill/concept using BKT
CREATE TABLE IF NOT EXISTS user_skill_mastery (
                                                  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                  skill_type              VARCHAR(50) NOT NULL,  -- 'WORD_LINKING', 'NAMES_FACES', 'NUMBER_PEG', 'QUIZ'
                                                  concept_id              VARCHAR(100),          -- Optional: specific concept (e.g., article UUID for quizzes)

    -- ========== BKT Parameters ==========
    -- P(L) - Probability that the user has mastered this skill (0.0 to 1.0)
                                                  probability_known       DOUBLE PRECISION NOT NULL DEFAULT 0.3,

    -- P(T) - Learning rate: probability of learning from one practice (0.0 to 1.0)
                                                  probability_learned     DOUBLE PRECISION NOT NULL DEFAULT 0.1,

    -- P(S) - Slip probability: chance of mistake despite knowing (0.0 to 1.0)
                                                  probability_slip        DOUBLE PRECISION NOT NULL DEFAULT 0.1,

    -- P(G) - Guess probability: chance of correct answer by luck (0.0 to 1.0)
                                                  probability_guess       DOUBLE PRECISION NOT NULL DEFAULT 0.25,

    -- ========== Performance Tracking ==========
                                                  total_attempts          INTEGER NOT NULL DEFAULT 0,
                                                  correct_attempts        INTEGER NOT NULL DEFAULT 0,
                                                  last_attempt_at         TIMESTAMPTZ,

    -- ========== Spaced Repetition (SM-2 Algorithm) ==========
                                                  next_review_at          TIMESTAMPTZ,
                                                  review_interval_days    DOUBLE PRECISION DEFAULT 1.0,
                                                  ease_factor             DOUBLE PRECISION DEFAULT 2.5,  -- 1.3 to 2.5+

                                                  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                                                  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

                                                  UNIQUE(user_id, skill_type, concept_id)
);

CREATE INDEX IF NOT EXISTS idx_skill_mastery_user ON user_skill_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_mastery_skill_type ON user_skill_mastery(skill_type);
CREATE INDEX IF NOT EXISTS idx_skill_mastery_review ON user_skill_mastery(next_review_at)
    WHERE next_review_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_skill_mastery_mastered ON user_skill_mastery(user_id, probability_known)
    WHERE probability_known >= 0.95;

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trg_user_skill_mastery_updated_at ON user_skill_mastery;
CREATE TRIGGER trg_user_skill_mastery_updated_at
    BEFORE UPDATE ON user_skill_mastery
    FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- Track detailed attempt history for ML analysis and debugging
CREATE TABLE IF NOT EXISTS skill_attempt_history (
                                                     id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                     user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                                     skill_mastery_id        UUID REFERENCES user_skill_mastery(id) ON DELETE CASCADE,
                                                     exercise_session_id     UUID REFERENCES exercise_sessions(id) ON DELETE CASCADE,

    -- Attempt details
                                                     skill_type              VARCHAR(50) NOT NULL,
                                                     difficulty_level        INTEGER NOT NULL,
                                                     was_correct             BOOLEAN NOT NULL,
                                                     response_time_ms        INTEGER,

    -- Context at time of attempt
                                                     time_since_last_practice_hours DOUBLE PRECISION,
                                                     user_skill_level_at_time INTEGER,

    -- BKT state snapshots (for analysis and debugging)
                                                     probability_known_before DOUBLE PRECISION,
                                                     probability_known_after  DOUBLE PRECISION,

                                                     created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempt_history_user ON skill_attempt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_attempt_history_skill ON skill_attempt_history(skill_mastery_id);
CREATE INDEX IF NOT EXISTS idx_attempt_history_session ON skill_attempt_history(exercise_session_id);
CREATE INDEX IF NOT EXISTS idx_attempt_history_created ON skill_attempt_history(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE user_skill_mastery IS 'Tracks user mastery of skills using Bayesian Knowledge Tracing (BKT) and spaced repetition';
COMMENT ON COLUMN user_skill_mastery.probability_known IS 'P(L): Current probability that user has mastered this skill (0-1)';
COMMENT ON COLUMN user_skill_mastery.probability_learned IS 'P(T): Learning rate - probability of learning from one practice (0-1)';
COMMENT ON COLUMN user_skill_mastery.probability_slip IS 'P(S): Slip rate - probability of mistake despite knowing (0-1)';
COMMENT ON COLUMN user_skill_mastery.probability_guess IS 'P(G): Guess rate - probability of correct answer by luck (0-1)';
COMMENT ON COLUMN user_skill_mastery.ease_factor IS 'SM-2 ease factor: higher = easier to remember, longer review intervals';

COMMENT ON TABLE skill_attempt_history IS 'Detailed history of all skill attempts for ML analysis and BKT debugging';