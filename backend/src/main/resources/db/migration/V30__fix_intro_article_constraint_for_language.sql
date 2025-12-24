-- ============================================================================
-- FIX INTRO ARTICLE CONSTRAINT TO SUPPORT MULTIPLE LANGUAGES
-- The old constraint allowed only ONE intro article per category across all languages.
-- This fixes it to allow ONE intro article per category PER LANGUAGE.
-- ============================================================================

-- Drop the old constraint that didn't consider language
DROP INDEX IF EXISTS idx_one_intro_per_category;

-- Create a new constraint that allows one intro article per category per language
-- This allows having an intro article for "MEMORY_PALACE" in English AND Polish
CREATE UNIQUE INDEX idx_one_intro_per_category_per_language
    ON learning_articles(technique_category, language)
    WHERE is_intro_article = true;

-- Add comment to document the constraint
COMMENT ON INDEX idx_one_intro_per_category_per_language IS
    'Ensures only one intro article exists per technique category per language. Allows multilingual intro articles.';