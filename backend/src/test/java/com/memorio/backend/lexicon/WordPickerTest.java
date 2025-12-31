package com.memorio.backend.lexicon;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("WordPicker Unit Tests")
class WordPickerTest {

    @Mock
    private WordRepository wordRepository;

    private WordPicker wordPicker;

    @BeforeEach
    void setUp() {
        wordPicker = new WordPicker(wordRepository);
    }

    @Test
    @DisplayName("Should return empty list when no words exist for language")
    void shouldReturnEmptyListWhenNoWords() {
        when(wordRepository.countByLanguage("en")).thenReturn(0);

        List<String> result = wordPicker.pickWords("en", 1, 5);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should return words for valid language and level")
    void shouldReturnWordsForValidInput() {
        when(wordRepository.countByLanguage("en")).thenReturn(100);
        List<Word> words = createWords(10);
        when(wordRepository.findByLanguageWithPagination(eq("en"), any(PageRequest.class)))
                .thenReturn(words);

        List<String> result = wordPicker.pickWords("en", 1, 5);

        assertNotNull(result);
        assertEquals(5, result.size());
    }

    @Test
    @DisplayName("Should return fewer words when not enough available")
    void shouldReturnFewerWordsWhenNotEnoughAvailable() {
        when(wordRepository.countByLanguage("en")).thenReturn(100);
        List<Word> words = createWords(3);
        when(wordRepository.findByLanguageWithPagination(eq("en"), any(PageRequest.class)))
                .thenReturn(words);

        List<String> result = wordPicker.pickWords("en", 1, 10);

        assertEquals(3, result.size());
    }

    @Test
    @DisplayName("Should return empty list when repository returns empty")
    void shouldReturnEmptyListWhenRepositoryEmpty() {
        when(wordRepository.countByLanguage("en")).thenReturn(100);
        when(wordRepository.findByLanguageWithPagination(eq("en"), any(PageRequest.class)))
                .thenReturn(List.of());

        List<String> result = wordPicker.pickWords("en", 1, 5);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should handle different skill levels")
    void shouldHandleDifferentSkillLevels() {
        when(wordRepository.countByLanguage("en")).thenReturn(1000);
        List<Word> words = createWords(20);
        when(wordRepository.findByLanguageWithPagination(eq("en"), any(PageRequest.class)))
                .thenReturn(words);

        List<String> level1 = wordPicker.pickWords("en", 1, 5);
        List<String> level5 = wordPicker.pickWords("en", 5, 5);
        List<String> level10 = wordPicker.pickWords("en", 10, 5);

        assertNotNull(level1);
        assertNotNull(level5);
        assertNotNull(level10);
        assertEquals(5, level1.size());
        assertEquals(5, level5.size());
        assertEquals(5, level10.size());
    }

    @Test
    @DisplayName("Should clamp skill level to valid range 1-10")
    void shouldClampSkillLevel() {
        when(wordRepository.countByLanguage("en")).thenReturn(100);
        List<Word> words = createWords(10);
        when(wordRepository.findByLanguageWithPagination(eq("en"), any(PageRequest.class)))
                .thenReturn(words);

        // Level below 1 should be treated as 1
        List<String> belowMin = wordPicker.pickWords("en", 0, 5);
        assertNotNull(belowMin);

        // Level above 10 should be treated as 10
        List<String> aboveMax = wordPicker.pickWords("en", 15, 5);
        assertNotNull(aboveMax);
    }

    @Test
    @DisplayName("Should use pickRandom for random word selection")
    void shouldUsePickRandom() {
        List<Word> words = createWords(5);
        when(wordRepository.findRandomByLanguage("en", 5)).thenReturn(words);

        List<String> result = wordPicker.pickRandom("en", 5);

        assertEquals(5, result.size());
        verify(wordRepository).findRandomByLanguage("en", 5);
    }

    @Test
    @DisplayName("Should return empty list from pickRandom when no words")
    void shouldReturnEmptyFromPickRandomWhenNoWords() {
        when(wordRepository.findRandomByLanguage("pl", 5)).thenReturn(List.of());

        List<String> result = wordPicker.pickRandom("pl", 5);

        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should extract text from Word objects correctly")
    void shouldExtractTextFromWords() {
        List<Word> words = List.of(
                createWord("apple"),
                createWord("banana"),
                createWord("cherry")
        );
        when(wordRepository.findRandomByLanguage("en", 3)).thenReturn(words);

        List<String> result = wordPicker.pickRandom("en", 3);

        assertTrue(result.contains("apple"));
        assertTrue(result.contains("banana"));
        assertTrue(result.contains("cherry"));
    }

    @Test
    @DisplayName("Should handle large word count")
    void shouldHandleLargeWordCount() {
        when(wordRepository.countByLanguage("en")).thenReturn(5000);
        List<Word> words = createWords(100);
        when(wordRepository.findByLanguageWithPagination(eq("en"), any(PageRequest.class)))
                .thenReturn(words);

        List<String> result = wordPicker.pickWords("en", 5, 50);

        assertEquals(50, result.size());
    }

    @Test
    @DisplayName("Should shuffle words for randomness")
    void shouldShuffleWordsForRandomness() {
        when(wordRepository.countByLanguage("en")).thenReturn(100);
        List<Word> words = createWords(20);
        when(wordRepository.findByLanguageWithPagination(eq("en"), any(PageRequest.class)))
                .thenReturn(words);

        // Get multiple results and check they're not always in the same order
        List<String> result1 = wordPicker.pickWords("en", 1, 10);
        List<String> result2 = wordPicker.pickWords("en", 1, 10);
        List<String> result3 = wordPicker.pickWords("en", 1, 10);

        // At least one pair should be different (probabilistic but very likely)
        boolean hasDifference = !result1.equals(result2) || !result2.equals(result3) || !result1.equals(result3);
        assertTrue(hasDifference || result1.size() <= 1,
                "Multiple calls should produce shuffled results");
    }

    @Test
    @DisplayName("Should handle different languages")
    void shouldHandleDifferentLanguages() {
        when(wordRepository.countByLanguage("pl")).thenReturn(50);
        List<Word> polishWords = createWords(10);
        when(wordRepository.findByLanguageWithPagination(eq("pl"), any(PageRequest.class)))
                .thenReturn(polishWords);

        List<String> result = wordPicker.pickWords("pl", 3, 5);

        assertEquals(5, result.size());
        verify(wordRepository).countByLanguage("pl");
    }

    private List<Word> createWords(int count) {
        List<Word> words = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            words.add(createWord("word" + i));
        }
        return words;
    }

    private Word createWord(String text) {
        return new Word(
                UUID.randomUUID(),
                "en",
                text,
                text.toLowerCase(),
                "noun",
                1,
                OffsetDateTime.now()
        );
    }
}
