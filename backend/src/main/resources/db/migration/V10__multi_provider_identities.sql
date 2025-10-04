-- 0) (If you want UUIDs generated in DB)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create the identities table
CREATE TABLE IF NOT EXISTS user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_identities_provider_uid UNIQUE (provider, provider_user_id)
);

-- Optional helper: one identity per provider per user (prevents duplicates like two Googles for same user)
CREATE UNIQUE INDEX IF NOT EXISTS user_identities_user_provider_uidx
  ON user_identities (user_id, provider);

-- 2) Backfill from existing columns on users (if you already had Google there)
INSERT INTO user_identities (user_id, provider, provider_user_id)
SELECT u.id, u.provider, u.provider_id
FROM users u
WHERE u.provider IS NOT NULL AND u.provider_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3) (If you previously added a unique index on users(provider,provider_id), drop it safely)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND indexname = 'users_provider_pid_uidx'
  ) THEN
    EXECUTE 'DROP INDEX users_provider_pid_uidx';
  END IF;
END$$;

-- 4) Remove provider columns from users (we keep picture_url on users)
ALTER TABLE users
  DROP COLUMN IF EXISTS provider,
  DROP COLUMN IF EXISTS provider_id;

-- 5) Trigger to auto-update updated_at on user_identities (optional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $BODY$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $BODY$ LANGUAGE plpgsql;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_identities_updated_at') THEN
    CREATE TRIGGER trg_user_identities_updated_at
    BEFORE UPDATE ON user_identities
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;