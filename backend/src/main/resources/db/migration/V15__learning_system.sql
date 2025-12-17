-- ============================================================================
-- LEARNING SYSTEM TABLES
-- Educational content (memory techniques) with quizzes and progress tracking
-- ============================================================================
-- 1. LEARNING ARTICLES
-- Stores educational content about memory techniques (Method of Loci, Story Method, etc.)
CREATE TABLE IF NOT EXISTS learning_articles (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content Identification
    slug                    VARCHAR(100) UNIQUE NOT NULL,              -- URL-friendly: "method-of-loci-basics"
    title                   VARCHAR(200) NOT NULL,                     -- "Master the Method of Loci"
    subtitle                VARCHAR(300),                              -- Optional tagline
    
    -- Categorization
    technique_category      VARCHAR(50) NOT NULL,                      -- 'METHOD_OF_LOCI', 'STORY_METHOD', 'PAO_SYSTEM', etc.
    difficulty_level        INTEGER NOT NULL DEFAULT 1,                -- 1=beginner, 2=intermediate, 3=advanced
    
    -- Content
    content_markdown        TEXT NOT NULL,                             -- Article body in Markdown format
    cover_image_url         TEXT,                                      -- Optional hero image
    
    -- Metadata
    author                  VARCHAR(100),                              -- Who wrote it
    estimated_read_minutes  INTEGER NOT NULL DEFAULT 5,                -- Reading time estimate
    
    -- Access Control
    required_skill_level    INTEGER NOT NULL DEFAULT 1,                -- User must be at this level to access
    is_published            BOOLEAN NOT NULL DEFAULT false,            -- Only show published articles
    
    -- Ordering
    display_order           INTEGER NOT NULL DEFAULT 0,                -- Control sequence in UI
    
    -- Timestamps
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_articles_category ON learning_articles(technique_category);
CREATE INDEX IF NOT EXISTS idx_articles_published ON learning_articles(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_articles_order ON learning_articles(display_order);
CREATE INDEX IF NOT EXISTS idx_articles_skill_level ON learning_articles(required_skill_level);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trg_learning_articles_updated_at ON learning_articles;
CREATE TRIGGER trg_learning_articles_updated_at
BEFORE UPDATE ON learning_articles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- 2. ARTICLE QUIZZES
-- One quiz per article to test comprehension
CREATE TABLE IF NOT EXISTS article_quizzes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id          UUID NOT NULL REFERENCES learning_articles(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,                     -- "Test Your Knowledge"
    passing_score       INTEGER NOT NULL DEFAULT 70,               -- Percentage needed to pass (70%)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one quiz per article
    UNIQUE(article_id)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_article ON article_quizzes(article_id);


-- 3. QUIZ QUESTIONS
-- Multiple-choice questions for each quiz
CREATE TABLE IF NOT EXISTS quiz_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id             UUID NOT NULL REFERENCES article_quizzes(id) ON DELETE CASCADE,
    question_text       TEXT NOT NULL,                             -- "What is the first step in Method of Loci?"
    question_type       VARCHAR(30) NOT NULL DEFAULT 'MULTIPLE_CHOICE',  -- Future: 'TRUE_FALSE', 'FILL_BLANK'
    display_order       INTEGER NOT NULL DEFAULT 0,                -- Question sequence in quiz
    explanation         TEXT,                                      -- Shown after answering, explains correct answer
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON quiz_questions(quiz_id, display_order);


-- 4. QUIZ QUESTION OPTIONS
-- Answer choices for each question (typically 4 options per question)
CREATE TABLE IF NOT EXISTS quiz_question_options (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text         TEXT NOT NULL,                             -- "Choose a familiar location"
    is_correct          BOOLEAN NOT NULL DEFAULT false,            -- Only one should be true per question
    display_order       INTEGER NOT NULL DEFAULT 0,                -- Order of options in UI
    
    -- Ensure at least display order uniqueness per question
    UNIQUE(question_id, display_order)
);

CREATE INDEX IF NOT EXISTS idx_options_question ON quiz_question_options(question_id);


-- 5. USER ARTICLE PROGRESS
-- Track what each user has read and their quiz performance
CREATE TABLE IF NOT EXISTS user_article_progress (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id              UUID NOT NULL REFERENCES learning_articles(id) ON DELETE CASCADE,
    
    -- Reading Progress
    has_read                BOOLEAN NOT NULL DEFAULT false,
    first_read_at           TIMESTAMPTZ,
    
    -- Quiz Performance
    quiz_completed          BOOLEAN NOT NULL DEFAULT false,
    quiz_score              INTEGER,                               -- Percentage (0-100)
    quiz_attempts           INTEGER NOT NULL DEFAULT 0,            -- How many times they tried
    quiz_completed_at       TIMESTAMPTZ,
    
    -- Timestamps
    last_updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One progress record per user per article
    UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_article_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_article ON user_article_progress(article_id);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON user_article_progress(user_id, quiz_completed) 
    WHERE quiz_completed = true;

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS trg_user_article_progress_updated_at ON user_article_progress;
CREATE TRIGGER trg_user_article_progress_updated_at
BEFORE UPDATE ON user_article_progress
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- 6. ARTICLE TAGS (Optional but recommended for better discovery)
-- Many-to-many relationship for categorizing articles
CREATE TABLE IF NOT EXISTS article_tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) UNIQUE NOT NULL,                   -- "visualization", "memory-palace", "beginner-friendly"
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_tag_assignments (
    article_id  UUID NOT NULL REFERENCES learning_articles(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES article_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tag_assignments_article ON article_tag_assignments(article_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_tag ON article_tag_assignments(tag_id);

