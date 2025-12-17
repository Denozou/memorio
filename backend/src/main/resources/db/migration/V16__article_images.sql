-- Article cover images stored in database
CREATE TABLE IF NOT EXISTS article_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES learning_articles(id) ON DELETE CASCADE,
    filename VARCHAR(150) NOT NULL,
    image_data BYTEA NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_article_images_article_id ON article_images(article_id);

-- Update articles table to reference image (only if column doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='learning_articles' AND column_name='cover_image_id') THEN
        ALTER TABLE learning_articles
        ADD COLUMN cover_image_id UUID REFERENCES article_images(id);
    END IF;
END $$;