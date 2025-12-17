-- Add topic organization fields to learning_articles
ALTER TABLE learning_articles
ADD COLUMN topic_group VARCHAR(100),
ADD COLUMN sequence_in_topic INTEGER,
ADD COLUMN is_topic_intro BOOLEAN DEFAULT false;

-- Update existing articles with default values (you'll need to customize this)
-- For now, treat all existing articles as intro articles of their own topic
UPDATE learning_articles
SET
    topic_group = COALESCE(slug, 'default-topic'),
    sequence_in_topic = 1,
    is_topic_intro = true
WHERE topic_group IS NULL;

-- Make columns NOT NULL after setting defaults
ALTER TABLE learning_articles
ALTER COLUMN topic_group SET NOT NULL,
ALTER COLUMN sequence_in_topic SET NOT NULL,
ALTER COLUMN is_topic_intro SET NOT NULL;

-- Create index for efficient topic queries
CREATE INDEX idx_learning_articles_topic ON learning_articles(topic_group, sequence_in_topic);

-- Make required_skill_level optional (no longer needed for gating)
ALTER TABLE learning_articles
ALTER COLUMN required_skill_level DROP NOT NULL;