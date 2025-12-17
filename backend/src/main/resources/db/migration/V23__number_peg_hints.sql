-- Create the number_peg_hints table
CREATE TABLE number_peg_hints (
    digit INTEGER NOT NULL,
    language VARCHAR(12) NOT NULL,
    hint_word VARCHAR(100) NOT NULL,
    PRIMARY KEY (digit, language)
);

-- Create index for faster language lookups
CREATE INDEX idx_number_peg_hints_language ON number_peg_hints(language);

-- Insert English hints (sound-based)
INSERT INTO number_peg_hints (digit, language, hint_word) VALUES
(0, 'en', 'Hero'),
(1, 'en', 'Sun'),
(2, 'en', 'Shoe'),
(3, 'en', 'Tree'),
(4, 'en', 'Door'),
(5, 'en', 'Hive'),
(6, 'en', 'Bricks'),
(7, 'en', 'Heaven'),
(8, 'en', 'Gate'),
(9, 'en', 'Wine');

-- Insert Polish hints (sound-based)
INSERT INTO number_peg_hints (digit, language, hint_word) VALUES
(0, 'pl', 'Pióro'),           -- ball (use '' to escape single quote)
(1, 'pl', 'Dzień'),             -- son
(2, 'pl', 'Sowa'),          -- swan
(3, 'pl', 'Drzwi'),         -- butterfly
(4, 'pl', 'Swetry'),          -- flag
(5, 'pl', 'Pamięć'),           -- hook
(6, 'pl', 'Część'),           -- cherry
(7, 'pl', 'Modem'),           -- cliff
(8, 'pl', 'Jesień'),        -- snowman
(9, 'pl', 'Niedźwiedź');  -- balloon

-- Future: Add Polish hints
-- INSERT INTO number_peg_hints (digit, language, hint_word) VALUES
-- (0, 'pl', 'piłka'),
-- (1, 'pl', 'ołówek'),
-- ...