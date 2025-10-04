ALTER TABLE users
    ADD COLUMN provider VARCHAR(255),
    ADD COLUMN provider_id VARCHAR(255),
    ALTER COLUMN password_hash DROP NOT NULL;