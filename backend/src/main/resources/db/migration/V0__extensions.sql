-- Enable extensions (safe to run; IF NOT EXISTS keeps it idempotent)
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;   -- case-insensitive text (emails)