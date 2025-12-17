-- Drop the old topic-based columns if they exist
ALTER TABLE learning_articles 
DROP COLUMN IF EXISTS topic_group,
DROP COLUMN IF EXISTS sequence_in_topic,
DROP COLUMN IF EXISTS is_topic_intro;

-- Add category-based sequential learning fields to learning_articles
ALTER TABLE learning_articles
ADD COLUMN IF NOT EXISTS sequence_in_category INTEGER,
ADD COLUMN IF NOT EXISTS is_intro_article BOOLEAN DEFAULT false;

-- Update existing articles with default values
-- Treat all existing articles as intro articles with sequence 1
UPDATE learning_articles
SET
    sequence_in_category = COALESCE(sequence_in_category, 1),
    is_intro_article = COALESCE(is_intro_article, true)
WHERE sequence_in_category IS NULL;

-- Make columns NOT NULL after setting defaults
ALTER TABLE learning_articles
ALTER COLUMN sequence_in_category SET NOT NULL,
ALTER COLUMN is_intro_article SET NOT NULL;

-- Create index for efficient category-based queries
CREATE INDEX IF NOT EXISTS idx_learning_articles_category_seq ON learning_articles(technique_category, sequence_in_category);

-- Make required_skill_level optional (no longer needed for gating)
ALTER TABLE learning_articles
ALTER COLUMN required_skill_level DROP NOT NULL;
