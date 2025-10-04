CREATE TABLE IF NOT EXISTS words (
    id         UUID PRIMARY KEY,
    language   VARCHAR(8)  NOT NULL,     -- 'en' for your file
    text       VARCHAR(128) NOT NULL,    -- the word as-is
    lemma      VARCHAR(128),             -- keep for future; set = text for now
    pos        VARCHAR(16),              -- 'NOUN' for your file
    freq_rank  INTEGER,                  -- 1..1000 based on file line number
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_words_lang_text
  ON words (language, lower(text));

CREATE INDEX IF NOT EXISTS idx_words_lang_rank
  ON words (language, freq_rank);