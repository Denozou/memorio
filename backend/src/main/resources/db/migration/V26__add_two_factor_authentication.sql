-- Add Two-Factor Authentication support to users table
-- This enables TOTP (Time-based One-Time Password) authentication
-- Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.

ALTER TABLE users
    -- Flag indicating if 2FA is enabled for this user
    ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- Base32-encoded secret shared between server and authenticator app
    -- This should be encrypted at the application layer before storage
    -- Example: "JBSWY3DPEHPK3PXP" (32 characters)
    ADD COLUMN two_factor_secret TEXT,

    -- JSON array of hashed backup codes for account recovery
    -- Each code can be used once if user loses access to authenticator
    -- Example: ["$2a$10$hash1...", "$2a$10$hash2...", ...]
    ADD COLUMN backup_codes TEXT,

    -- Timestamp when 2FA was enabled (for audit trail)
    ADD COLUMN two_factor_enabled_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient lookup of 2FA-enabled users
-- Useful for security audits and statistics
CREATE INDEX idx_users_two_factor_enabled
    ON users(two_factor_enabled)
    WHERE two_factor_enabled = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users.two_factor_secret IS 'Base32-encoded TOTP secret (should be encrypted at application layer)';
COMMENT ON COLUMN users.backup_codes IS 'JSON array of bcrypt-hashed backup codes for 2FA recovery';