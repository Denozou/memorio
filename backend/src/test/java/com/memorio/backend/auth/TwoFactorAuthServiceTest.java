package com.memorio.backend.auth;

import com.memorio.backend.user.User;
import dev.samstevens.totp.exceptions.QrGenerationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TwoFactorAuthService Unit Tests")
class TwoFactorAuthServiceTest {

    private TwoFactorAuthService twoFactorAuthService;
    private PasswordEncoder passwordEncoder;
    private User testUser;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        twoFactorAuthService = new TwoFactorAuthService(passwordEncoder);
        
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setDisplayName("Test User");
    }

    @Test
    @DisplayName("Should generate valid secret")
    void shouldGenerateValidSecret() {
        String secret = twoFactorAuthService.generateSecret();

        assertNotNull(secret);
        assertFalse(secret.isEmpty());
        assertTrue(secret.length() >= 16, "Secret should be at least 16 characters");
    }

    @Test
    @DisplayName("Should generate different secrets each time")
    void shouldGenerateDifferentSecrets() {
        String secret1 = twoFactorAuthService.generateSecret();
        String secret2 = twoFactorAuthService.generateSecret();

        assertNotEquals(secret1, secret2);
    }

    @Test
    @DisplayName("Should generate QR code data URL")
    void shouldGenerateQrCodeDataUrl() throws QrGenerationException {
        String secret = twoFactorAuthService.generateSecret();

        String qrCodeDataUrl = twoFactorAuthService.generateQrCodeDataUrl(testUser, secret);

        assertNotNull(qrCodeDataUrl);
        assertTrue(qrCodeDataUrl.startsWith("data:image/png;base64,"));
    }

    @Test
    @DisplayName("Should throw exception when generating QR code with null user")
    void shouldThrowExceptionForNullUserInQrGeneration() {
        String secret = twoFactorAuthService.generateSecret();

        assertThrows(IllegalArgumentException.class, () -> {
            twoFactorAuthService.generateQrCodeDataUrl(null, secret);
        });
    }

    @Test
    @DisplayName("Should throw exception when generating QR code with null secret")
    void shouldThrowExceptionForNullSecretInQrGeneration() {
        assertThrows(IllegalArgumentException.class, () -> {
            twoFactorAuthService.generateQrCodeDataUrl(testUser, null);
        });
    }

    @Test
    @DisplayName("Should generate manual entry key")
    void shouldGenerateManualEntryKey() {
        String secret = twoFactorAuthService.generateSecret();

        String manualKey = twoFactorAuthService.generateManualEntryKey(testUser, secret);

        assertNotNull(manualKey);
        assertTrue(manualKey.startsWith("otpauth://totp/Memorio:"));
        assertTrue(manualKey.contains("secret=" + secret));
        assertTrue(manualKey.contains("issuer=Memorio"));
        assertTrue(manualKey.contains("algorithm=SHA1"));
        assertTrue(manualKey.contains("digits=6"));
        assertTrue(manualKey.contains("period=30"));
    }

    @Test
    @DisplayName("Should throw exception when generating manual key with null user")
    void shouldThrowExceptionForNullUserInManualKey() {
        String secret = twoFactorAuthService.generateSecret();

        assertThrows(IllegalArgumentException.class, () -> {
            twoFactorAuthService.generateManualEntryKey(null, secret);
        });
    }

    @Test
    @DisplayName("Should return false for null secret in verification")
    void shouldReturnFalseForNullSecretInVerification() {
        boolean result = twoFactorAuthService.verifyCode(null, "123456");

        assertFalse(result);
    }

    @Test
    @DisplayName("Should return false for null code in verification")
    void shouldReturnFalseForNullCodeInVerification() {
        String secret = twoFactorAuthService.generateSecret();

        boolean result = twoFactorAuthService.verifyCode(secret, null);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should handle code with spaces and hyphens")
    void shouldHandleCodeWithSpacesAndHyphens() {
        String secret = twoFactorAuthService.generateSecret();
        String codeWithSpaces = "123 456";
        
        boolean result = twoFactorAuthService.verifyCode(secret, codeWithSpaces);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should generate 10 backup codes")
    void shouldGenerateTenBackupCodes() {
        List<String> backupCodes = twoFactorAuthService.generateBackupCodes();

        assertEquals(10, backupCodes.size());
    }

    @Test
    @DisplayName("Should generate backup codes in correct format")
    void shouldGenerateBackupCodesInCorrectFormat() {
        List<String> backupCodes = twoFactorAuthService.generateBackupCodes();

        for (String code : backupCodes) {
            assertTrue(code.matches("\\d{4}-\\d{4}"), 
                "Code should match format XXXX-XXXX: " + code);
        }
    }

    @Test
    @DisplayName("Should generate unique backup codes")
    void shouldGenerateUniqueBackupCodes() {
        List<String> backupCodes = twoFactorAuthService.generateBackupCodes();

        long uniqueCount = backupCodes.stream().distinct().count();
        assertEquals(10, uniqueCount, "All backup codes should be unique");
    }

    @Test
    @DisplayName("Should hash backup codes")
    void shouldHashBackupCodes() {
        List<String> plainCodes = List.of("1234-5678", "8765-4321");

        List<String> hashedCodes = twoFactorAuthService.hashBackupCodes(plainCodes);

        assertEquals(plainCodes.size(), hashedCodes.size());
        for (int i = 0; i < plainCodes.size(); i++) {
            assertNotEquals(plainCodes.get(i), hashedCodes.get(i));
            assertTrue(hashedCodes.get(i).startsWith("$2a$") || hashedCodes.get(i).startsWith("$2b$"));
        }
    }

    @Test
    @DisplayName("Should verify valid backup code")
    void shouldVerifyValidBackupCode() {
        String plainCode = "1234-5678";
        List<String> hashedCodes = twoFactorAuthService.hashBackupCodes(List.of(plainCode));

        boolean result = twoFactorAuthService.verifyBackupCode(hashedCodes, plainCode);

        assertTrue(result);
    }

    @Test
    @DisplayName("Should reject invalid backup code")
    void shouldRejectInvalidBackupCode() {
        String plainCode = "1234-5678";
        List<String> hashedCodes = twoFactorAuthService.hashBackupCodes(List.of(plainCode));

        boolean result = twoFactorAuthService.verifyBackupCode(hashedCodes, "9999-9999");

        assertFalse(result);
    }

    @Test
    @DisplayName("Should return false when verifying with null hashed codes")
    void shouldReturnFalseForNullHashedCodes() {
        boolean result = twoFactorAuthService.verifyBackupCode(null, "1234-5678");

        assertFalse(result);
    }

    @Test
    @DisplayName("Should return false when verifying with empty hashed codes")
    void shouldReturnFalseForEmptyHashedCodes() {
        boolean result = twoFactorAuthService.verifyBackupCode(List.of(), "1234-5678");

        assertFalse(result);
    }

    @Test
    @DisplayName("Should return false when verifying with null input code")
    void shouldReturnFalseForNullInputCode() {
        List<String> hashedCodes = twoFactorAuthService.hashBackupCodes(List.of("1234-5678"));

        boolean result = twoFactorAuthService.verifyBackupCode(hashedCodes, null);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should handle backup code with spaces and hyphens")
    void shouldHandleBackupCodeWithSpacesAndHyphens() {
        String plainCode = "1234-5678";
        List<String> hashedCodes = twoFactorAuthService.hashBackupCodes(List.of(plainCode));

        boolean result = twoFactorAuthService.verifyBackupCode(hashedCodes, "1234 5678");

        assertTrue(result);
    }

    @Test
    @DisplayName("Should find used backup code hash")
    void shouldFindUsedBackupCodeHash() {
        String plainCode = "1234-5678";
        List<String> hashedCodes = twoFactorAuthService.hashBackupCodes(List.of(plainCode, "9999-9999"));

        String usedHash = twoFactorAuthService.findUsedBackupCodeHash(hashedCodes, plainCode);

        assertNotNull(usedHash);
        assertTrue(passwordEncoder.matches(plainCode, usedHash));
    }

    @Test
    @DisplayName("Should return null when code not found in hashes")
    void shouldReturnNullWhenCodeNotFound() {
        List<String> hashedCodes = twoFactorAuthService.hashBackupCodes(List.of("1234-5678"));

        String usedHash = twoFactorAuthService.findUsedBackupCodeHash(hashedCodes, "9999-9999");

        assertNull(usedHash);
    }

    @Test
    @DisplayName("Should return null for null hashed codes in findUsedBackupCodeHash")
    void shouldReturnNullForNullHashedCodesInFind() {
        String usedHash = twoFactorAuthService.findUsedBackupCodeHash(null, "1234-5678");

        assertNull(usedHash);
    }

    @Test
    @DisplayName("Should return null for null input code in findUsedBackupCodeHash")
    void shouldReturnNullForNullInputCodeInFind() {
        List<String> hashedCodes = twoFactorAuthService.hashBackupCodes(List.of("1234-5678"));

        String usedHash = twoFactorAuthService.findUsedBackupCodeHash(hashedCodes, null);

        assertNull(usedHash);
    }
}
