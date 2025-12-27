package com.memorio.backend.common.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("EncryptionService Unit Tests")
class EncryptionServiceTest {

    private EncryptionService encryptionService;
    private static final String VALID_KEY = "WWn0yxx7AOcGmdbrCeZI5dVRr7TB2nlIrysjIesEBHM=";

    @BeforeEach
    void setUp() {
        encryptionService = new EncryptionService(VALID_KEY);
    }

    @Test
    @DisplayName("Should throw exception for invalid key length")
    void shouldThrowExceptionForInvalidKeyLength() {
        String shortKey = Base64.getEncoder().encodeToString("shortkey".getBytes());
        
        assertThrows(IllegalArgumentException.class, () -> {
            new EncryptionService(shortKey);
        });
    }

    @Test
    @DisplayName("Should encrypt and decrypt text successfully")
    void shouldEncryptAndDecryptSuccessfully() {
        String plaintext = "sensitive-2fa-secret";

        String encrypted = encryptionService.encrypt(plaintext);
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals(plaintext, decrypted);
    }

    @Test
    @DisplayName("Should return different ciphertext for same plaintext")
    void shouldReturnDifferentCiphertextForSamePlaintext() {
        String plaintext = "test-secret";

        String encrypted1 = encryptionService.encrypt(plaintext);
        String encrypted2 = encryptionService.encrypt(plaintext);

        assertNotEquals(encrypted1, encrypted2, "Encryption should use random IV");
    }

    @Test
    @DisplayName("Should handle null plaintext")
    void shouldHandleNullPlaintext() {
        String result = encryptionService.encrypt(null);
        assertNull(result);
    }

    @Test
    @DisplayName("Should handle empty string")
    void shouldHandleEmptyString() {
        String result = encryptionService.encrypt("");
        assertEquals("", result);
    }

    @Test
    @DisplayName("Should handle null ciphertext in decryption")
    void shouldHandleNullCiphertext() {
        String result = encryptionService.decrypt(null);
        assertNull(result);
    }

    @Test
    @DisplayName("Should handle empty ciphertext in decryption")
    void shouldHandleEmptyCiphertext() {
        String result = encryptionService.decrypt("");
        assertEquals("", result);
    }

    @Test
    @DisplayName("Should encrypt long text")
    void shouldEncryptLongText() {
        String longText = "a".repeat(1000);

        String encrypted = encryptionService.encrypt(longText);
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals(longText, decrypted);
    }

    @Test
    @DisplayName("Should encrypt special characters")
    void shouldEncryptSpecialCharacters() {
        String specialChars = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";

        String encrypted = encryptionService.encrypt(specialChars);
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals(specialChars, decrypted);
    }

    @Test
    @DisplayName("Should encrypt unicode characters")
    void shouldEncryptUnicodeCharacters() {
        String unicode = "Hello 世界 🔐 Привет";

        String encrypted = encryptionService.encrypt(unicode);
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals(unicode, decrypted);
    }

    @Test
    @DisplayName("Should throw exception for tampered ciphertext")
    void shouldThrowExceptionForTamperedCiphertext() {
        String plaintext = "secret";
        String encrypted = encryptionService.encrypt(plaintext);
        
        String tampered = encrypted.substring(0, encrypted.length() - 5) + "XXXXX";

        assertThrows(RuntimeException.class, () -> {
            encryptionService.decrypt(tampered);
        });
    }

    @Test
    @DisplayName("Should throw exception for invalid base64")
    void shouldThrowExceptionForInvalidBase64() {
        String invalidBase64 = "not-valid-base64!!!";

        assertThrows(RuntimeException.class, () -> {
            encryptionService.decrypt(invalidBase64);
        });
    }

    @Test
    @DisplayName("Should produce base64 encoded output")
    void shouldProduceBase64EncodedOutput() {
        String plaintext = "test";
        String encrypted = encryptionService.encrypt(plaintext);

        assertDoesNotThrow(() -> {
            Base64.getDecoder().decode(encrypted);
        });
    }

    @Test
    @DisplayName("Should encrypt whitespace correctly")
    void shouldEncryptWhitespaceCorrectly() {
        String whitespace = "   \n\t\r   ";

        String encrypted = encryptionService.encrypt(whitespace);
        String decrypted = encryptionService.decrypt(encrypted);

        assertEquals(whitespace, decrypted);
    }

    @Test
    @DisplayName("Should handle multiple encrypt-decrypt cycles")
    void shouldHandleMultipleCycles() {
        String original = "cycle-test";

        String encrypted1 = encryptionService.encrypt(original);
        String decrypted1 = encryptionService.decrypt(encrypted1);
        String encrypted2 = encryptionService.encrypt(decrypted1);
        String decrypted2 = encryptionService.decrypt(encrypted2);

        assertEquals(original, decrypted2);
    }
}
