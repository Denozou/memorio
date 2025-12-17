-- Remove display_order column from learning_articles
-- It's redundant since we use sequence_in_category for ordering

ALTER TABLE learning_articles
DROP COLUMN IF EXISTS display_order;