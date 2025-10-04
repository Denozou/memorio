ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(8);

-- Optional default for existing rows (set everyone to 'en' initially)
UPDATE users SET preferred_language = 'en'
WHERE preferred_language IS NULL;