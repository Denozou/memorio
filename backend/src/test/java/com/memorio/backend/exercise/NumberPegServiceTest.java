package com.memorio.backend.exercise;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NumberPegService Unit Tests")
class NumberPegServiceTest {

    @Mock
    private NumberPegHintRepository repository;

    private NumberPegService numberPegService;

    @BeforeEach
    void setUp() {
        numberPegService = new NumberPegService(repository);
    }

    @Test
    @DisplayName("Should return hint word for existing digit and language")
    void shouldReturnHintForExistingDigitAndLanguage() {
        NumberPegHint hint = createHint(5, "en", "hive");
        when(repository.findByIdDigitAndIdLanguage(5, "en")).thenReturn(Optional.of(hint));

        String result = numberPegService.getHintWord(5, "en");

        assertEquals("hive", result);
        verify(repository).findByIdDigitAndIdLanguage(5, "en");
    }

    @Test
    @DisplayName("Should fallback to English when language not found")
    void shouldFallbackToEnglish() {
        when(repository.findByIdDigitAndIdLanguage(5, "pl")).thenReturn(Optional.empty());
        NumberPegHint englishHint = createHint(5, "en", "hive");
        when(repository.findByIdDigitAndIdLanguage(5, "en")).thenReturn(Optional.of(englishHint));

        String result = numberPegService.getHintWord(5, "pl");

        assertEquals("hive", result);
        verify(repository).findByIdDigitAndIdLanguage(5, "pl");
        verify(repository).findByIdDigitAndIdLanguage(5, "en");
    }

    @Test
    @DisplayName("Should return unknown when neither language nor English found")
    void shouldReturnUnknownWhenNotFound() {
        when(repository.findByIdDigitAndIdLanguage(5, "pl")).thenReturn(Optional.empty());
        when(repository.findByIdDigitAndIdLanguage(5, "en")).thenReturn(Optional.empty());

        String result = numberPegService.getHintWord(5, "pl");

        assertEquals("unknown", result);
    }

    @Test
    @DisplayName("Should return hint for all digits 0-9")
    void shouldReturnHintForAllDigits() {
        for (int digit = 0; digit <= 9; digit++) {
            NumberPegHint hint = createHint(digit, "en", "hint" + digit);
            when(repository.findByIdDigitAndIdLanguage(digit, "en")).thenReturn(Optional.of(hint));
        }

        for (int digit = 0; digit <= 9; digit++) {
            String result = numberPegService.getHintWord(digit, "en");
            assertEquals("hint" + digit, result);
        }
    }

    @Test
    @DisplayName("Should generate digit sequence with correct length for skill level 1")
    void shouldGenerateSequenceForLevel1() {
        List<Integer> sequence = numberPegService.generateDigitSequence(1);

        assertEquals(6, sequence.size()); // 4 + (1 * 2) = 6
        for (Integer digit : sequence) {
            assertTrue(digit >= 0 && digit <= 9);
        }
    }

    @Test
    @DisplayName("Should generate digit sequence with correct length for skill level 5")
    void shouldGenerateSequenceForLevel5() {
        List<Integer> sequence = numberPegService.generateDigitSequence(5);

        assertEquals(14, sequence.size()); // 4 + (5 * 2) = 14
    }

    @Test
    @DisplayName("Should generate digit sequence with correct length for skill level 10")
    void shouldGenerateSequenceForLevel10() {
        List<Integer> sequence = numberPegService.generateDigitSequence(10);

        assertEquals(24, sequence.size()); // 4 + (10 * 2) = 24
    }

    @Test
    @DisplayName("Should clamp skill level below 1 to minimum")
    void shouldClampLevelBelowMinimum() {
        List<Integer> sequence = numberPegService.generateDigitSequence(0);

        assertEquals(6, sequence.size()); // Clamped to level 1: 4 + (1 * 2) = 6
    }

    @Test
    @DisplayName("Should clamp skill level above 10 to maximum")
    void shouldClampLevelAboveMaximum() {
        List<Integer> sequence = numberPegService.generateDigitSequence(15);

        assertEquals(24, sequence.size()); // Clamped to level 10: 4 + (10 * 2) = 24
    }

    @Test
    @DisplayName("Should handle negative skill level")
    void shouldHandleNegativeLevel() {
        List<Integer> sequence = numberPegService.generateDigitSequence(-5);

        assertEquals(6, sequence.size()); // Clamped to level 1
    }

    @Test
    @DisplayName("Should generate random digits in valid range")
    void shouldGenerateDigitsInValidRange() {
        for (int i = 0; i < 10; i++) {
            List<Integer> sequence = numberPegService.generateDigitSequence(5);
            for (Integer digit : sequence) {
                assertTrue(digit >= 0 && digit <= 9,
                        "Digit " + digit + " is out of range 0-9");
            }
        }
    }

    @Test
    @DisplayName("Should generate different sequences on multiple calls")
    void shouldGenerateDifferentSequences() {
        List<Integer> sequence1 = numberPegService.generateDigitSequence(5);
        List<Integer> sequence2 = numberPegService.generateDigitSequence(5);

        // With 14 random digits, the probability of identical sequences is extremely low
        // This test might very rarely fail by chance, but that's acceptable
        assertFalse(sequence1.equals(sequence2) && sequence1.equals(numberPegService.generateDigitSequence(5)),
                "Generated sequences should be random");
    }

    @Test
    @DisplayName("Should not return null sequence")
    void shouldNotReturnNullSequence() {
        for (int level = 1; level <= 10; level++) {
            List<Integer> sequence = numberPegService.generateDigitSequence(level);
            assertNotNull(sequence);
            assertFalse(sequence.isEmpty());
        }
    }

    private NumberPegHint createHint(int digit, String language, String hintWord) {
        return new NumberPegHint(digit, language, hintWord);
    }
}
