-- Improve verification_tokens schema for better security and flexibility

-- 1. Change token column from VARCHAR(255) to TEXT for future flexibility
-- (Base64 tokens, HMAC signatures, etc.)
ALTER TABLE verification_tokens ALTER COLUMN token TYPE TEXT;

-- 2. Add unique constraint on (user_id, token_type) to prevent multiple active tokens
-- This prevents race conditions and ensures only one token per user per type
ALTER TABLE verification_tokens
    ADD CONSTRAINT uq_verification_tokens_user_token_type
        UNIQUE (user_id, token_type);

-- 3. Add index on token_type for better query performance
CREATE INDEX idx_verification_tokens_token_type ON verification_tokens(token_type);

-- 4. Add optional request_ip column for security auditing and abuse prevention
ALTER TABLE verification_tokens
    ADD COLUMN request_ip INET;

-- Note: expires_at is already NOT NULL (good!)
-- Note: Backend already validates: expires_at > NOW() AND used_at IS NULL (good!)