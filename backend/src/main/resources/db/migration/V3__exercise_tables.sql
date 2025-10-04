-- Sessions: one per exercise the user starts
CREATE TABLE IF NOT EXISTS exercise_sessions (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(64) NOT NULL,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ NULL
);

-- Attempts: one per submit (you can have multiple attempts per session if desired)
CREATE TABLE IF NOT EXISTS exercise_attempts (
    id                UUID PRIMARY KEY,
    session_id        UUID NOT NULL REFERENCES exercise_sessions(id) ON DELETE CASCADE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    shown_words_json  TEXT NOT NULL,   -- JSON string (array of strings)
    answers_json      TEXT NOT NULL,   -- JSON string (array of strings)
    total             INT NOT NULL,
    correct           INT NOT NULL,
    accuracy          DOUBLE PRECISION NOT NULL
);

-- Helpful index for querying user history
CREATE INDEX IF NOT EXISTS idx_exercise_sessions_user ON exercise_sessions(user_id);