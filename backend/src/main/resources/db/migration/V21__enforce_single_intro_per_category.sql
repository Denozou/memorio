UPDATE learning_articles a1
SET is_intro_article = false
WHERE is_intro_article = true
  AND sequence_in_category > 1
  AND EXISTS (
    SELECT 1 FROM learning_articles a2
    WHERE a2.technique_category = a1.technique_category
      AND a2.sequence_in_category = 1
      AND a2.is_intro_article = true
  );

-- This allows only one row with is_intro_article = true per technique_category
CREATE UNIQUE INDEX idx_one_intro_per_category
ON learning_articles(technique_category)
WHERE is_intro_article = true;