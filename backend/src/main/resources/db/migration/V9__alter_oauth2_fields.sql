-- Add user picture if you want to store it
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS picture_url TEXT;

-- Enforce uniqueness (provider, provider_id) when both present
CREATE UNIQUE INDEX IF NOT EXISTS users_provider_id_uidx
  ON users (provider, provider_id)
  WHERE provider IS NOT NULL AND provider_id IS NOT NULL;