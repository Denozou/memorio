-- ============================================================================
-- ADD MULTI-LANGUAGE SUPPORT TO ARTICLES
-- Allows each article to be associated with a specific language
-- ============================================================================

-- Add language column to learning_articles table
ALTER TABLE learning_articles
    ADD COLUMN IF NOT EXISTS language VARCHAR(8) NOT NULL DEFAULT 'en';

-- Create index for efficient language-based queries
-- This is critical for performance when filtering articles by language
CREATE INDEX IF NOT EXISTS idx_articles_language ON learning_articles(language);

-- Create composite index for the most common query pattern:
-- Finding published articles in a specific language, ordered by category
CREATE INDEX IF NOT EXISTS idx_articles_language_published
    ON learning_articles(language, is_published, technique_category, sequence_in_category)
    WHERE is_published = true;

-- Add comment to document the column
COMMENT ON COLUMN learning_articles.language IS 'ISO 639-1 language code (e.g., en, pl). Determines which language version of the article this is.';

-- Update existing articles to be English (or your default language)
UPDATE learning_articles
SET language = 'en'
WHERE language IS NULL OR language = '';