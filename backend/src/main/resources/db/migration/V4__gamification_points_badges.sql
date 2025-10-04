CREATE TABLE IF NOT EXISTS user_stats (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_points    BIGINT NOT NULL DEFAULT 0,
    total_attempts  BIGINT NOT NULL DEFAULT 0,
    total_correct   BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_badges (
    id          UUID PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code        VARCHAR(64) NOT NULL,         -- e.g., FIRST_ATTEMPT, FIRST_PERFECT
    awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, code)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);