-- Add new_email column for email change verification tokens
ALTER TABLE verification_tokens
ADD COLUMN new_email VARCHAR(255);

-- Add comment for clarity
COMMENT ON COLUMN verification_tokens.new_email IS 'Stores the new email address for EMAIL_CHANGE token type';
