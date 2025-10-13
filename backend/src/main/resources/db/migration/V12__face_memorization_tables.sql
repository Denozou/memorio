-- Migration for Face Memorization Exercise
-- Creates persons and face_images tables for storing face data in database

-- Create persons table
CREATE TABLE IF NOT EXISTS persons (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_name       VARCHAR(100) NOT NULL UNIQUE,           -- Original name from dataset (e.g., "John_Doe")
    display_name      VARCHAR(100) NOT NULL,                  -- Human-readable name (e.g., "John Doe")
    difficulty_level  INTEGER NOT NULL DEFAULT 1,             -- 1=Easy, 2=Medium, 3=Hard
    is_active         BOOLEAN NOT NULL DEFAULT true,          -- Whether available for exercises
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on person_name for fast lookups
CREATE INDEX IF NOT EXISTS idx_persons_person_name ON persons(person_name);

-- Create index on difficulty_level and is_active for exercise queries
CREATE INDEX IF NOT EXISTS idx_persons_difficulty_active ON persons(difficulty_level, is_active);

-- Create face_images table
CREATE TABLE IF NOT EXISTS face_images (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id    UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,  -- Foreign key to persons
    filename     VARCHAR(150) NOT NULL,                      -- Original filename (e.g., "John_Doe_0001.jpg")
    image_data   BYTEA NOT NULL,                            -- Binary image data (BLOB)
    content_type VARCHAR(50) NOT NULL DEFAULT 'image/jpeg', -- MIME type
    file_size    BIGINT NOT NULL DEFAULT 0,                 -- Size in bytes
    width        INTEGER,                                   -- Image width in pixels
    height       INTEGER,                                   -- Image height in pixels
    is_primary   BOOLEAN NOT NULL DEFAULT false,           -- Whether this is the primary image for the person
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on person_id for fast lookups of images by person
CREATE INDEX IF NOT EXISTS idx_face_images_person_id ON face_images(person_id);

-- Create index on person_id and filename for serving images via URL
CREATE INDEX IF NOT EXISTS idx_face_images_person_filename ON face_images(person_id, filename);

-- Create index on is_primary for finding primary images
CREATE INDEX IF NOT EXISTS idx_face_images_primary ON face_images(person_id, is_primary);

-- Add updated_at trigger for persons table
DROP TRIGGER IF EXISTS trg_persons_updated_at ON persons;
CREATE TRIGGER trg_persons_updated_at
    BEFORE UPDATE ON persons
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add updated_at trigger for face_images table
DROP TRIGGER IF EXISTS trg_face_images_updated_at ON face_images;
CREATE TRIGGER trg_face_images_updated_at
    BEFORE UPDATE ON face_images
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Add constraint to ensure only one primary image per person
CREATE UNIQUE INDEX IF NOT EXISTS idx_face_images_one_primary_per_person
    ON face_images(person_id)
    WHERE is_primary = true;

-- Add comments for documentation
--COMMENT ON TABLE persons IS 'Stores person information for face memorization exercises';
--COMMENT ON COLUMN persons.person_name IS 'Original name from dataset (e.g., John_Doe)';
--COMMENT ON COLUMN persons.display_name IS 'Human-readable name (e.g., John Doe)';
--COMMENT ON COLUMN persons.difficulty_level IS '1=Easy, 2=Medium, 3=Hard - used for exercise difficulty scaling';
--COMMENT ON COLUMN persons.is_active IS 'Whether this person is available for exercises';

--COMMENT ON TABLE face_images IS 'Stores face image binary data for persons';
--COMMENT ON COLUMN face_images.image_data IS 'Binary image data stored as BYTEA (BLOB)';
--COMMENT ON COLUMN face_images.is_primary IS 'Whether this is the primary/default image for the person';
