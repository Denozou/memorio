-- Add tutorial_completed flag to users table
ALTER TABLE users ADD COLUMN tutorial_completed BOOLEAN NOT NULL DEFAULT FALSE;
