-- Migrate from topic-based to category-based sequential learning

-- Step 1: Add new category-based columns if they don't exist
ALTER TABLE learning_articles
ADD COLUMN IF NOT EXISTS sequence_in_category INTEGER,
ADD COLUMN IF NOT EXISTS is_intro_article BOOLEAN DEFAULT false;

-- Step 2: Migrate data from topic fields if they exist
-- Check if we're coming from topic-based schema
DO $$
BEGIN
    -- If topic columns exist, migrate the data
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'learning_articles' AND column_name = 'sequence_in_topic') THEN
        
        UPDATE learning_articles
        SET
            sequence_in_category = sequence_in_topic,
            is_intro_article = is_topic_intro
        WHERE sequence_in_category IS NULL;
        
    ELSE
        -- If topic columns don't exist, set defaults for any NULL values
        UPDATE learning_articles
        SET
            sequence_in_category = COALESCE(sequence_in_category, 1),
            is_intro_article = COALESCE(is_intro_article, true)
        WHERE sequence_in_category IS NULL OR is_intro_article IS NULL;
    END IF;
END $$;

-- Step 3: Make new columns NOT NULL (if they aren't already)
DO $$
BEGIN
    ALTER TABLE learning_articles
    ALTER COLUMN sequence_in_category SET NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE learning_articles
    ALTER COLUMN is_intro_article SET NOT NULL;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Step 4: Drop old topic-based columns if they exist
ALTER TABLE learning_articles
DROP COLUMN IF EXISTS topic_group,
DROP COLUMN IF EXISTS sequence_in_topic,
DROP COLUMN IF EXISTS is_topic_intro;

-- Step 5: Drop old index and create new one
DROP INDEX IF EXISTS idx_learning_articles_topic;
CREATE INDEX IF NOT EXISTS idx_learning_articles_category_seq 
ON learning_articles(technique_category, sequence_in_category);
