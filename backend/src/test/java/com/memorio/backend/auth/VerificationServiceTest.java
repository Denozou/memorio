package com.memorio.backend.auth;

import com.memorio.backend.common.email.EmailService;
import com.memorio.backend.user.User;
import com.memorio.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VerificationService Unit Tests")
class VerificationServiceTest {

    @Mock
    private VerificationTokenRepository tokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private AuthService authService;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @InjectMocks
    private VerificationService verificationService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setDisplayName("Test User");
        testUser.setEmailVerified(false);

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("Should create and send email verification token")
    void shouldCreateAndSendEmailVerification() {
        doNothing().when(tokenRepository).deleteByUserIdAndTokenType(any(UUID.class), any(TokenType.class));
        when(tokenRepository.save(any(VerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString());

        verificationService.createAndSendEmailVerification(testUser);

        verify(tokenRepository).deleteByUserIdAndTokenType(testUser.getId(), TokenType.EMAIL_VERIFICATION);
        verify(tokenRepository).save(any(VerificationToken.class));
        verify(emailService).sendVerificationEmail(eq(testUser.getEmail()), anyString());
    }

    @Test
    @DisplayName("Should handle email service failure gracefully")
    void shouldHandleEmailServiceFailureGracefully() {
        doNothing().when(tokenRepository).deleteByUserIdAndTokenType(any(UUID.class), any(TokenType.class));
        when(tokenRepository.save(any(VerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doThrow(new RuntimeException("Email service down")).when(emailService).sendVerificationEmail(anyString(), anyString());

        assertDoesNotThrow(() -> {
            verificationService.createAndSendEmailVerification(testUser);
        });

        verify(tokenRepository).save(any(VerificationToken.class));
    }

    @Test
    @DisplayName("Should verify email with valid token")
    void shouldVerifyEmailWithValidToken() {
        VerificationToken token = new VerificationToken(
            testUser, 
            "valid-token", 
            TokenType.EMAIL_VERIFICATION, 
            OffsetDateTime.now().plusHours(24),
            "127.0.0.1"
        );

        when(tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(anyString(), any(OffsetDateTime.class)))
            .thenReturn(Optional.of(token));
        when(tokenRepository.save(any(VerificationToken.class))).thenReturn(token);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        doNothing().when(tokenRepository).deleteByUserIdAndTokenType(any(UUID.class), any(TokenType.class));

        boolean result = verificationService.verifyEmail("valid-token");

        assertTrue(result);
        assertTrue(testUser.isEmailVerified());
        verify(tokenRepository).save(token);
        verify(userRepository).save(testUser);
        verify(tokenRepository).deleteByUserIdAndTokenType(testUser.getId(), TokenType.EMAIL_VERIFICATION);
    }

    @Test
    @DisplayName("Should reject expired token")
    void shouldRejectExpiredToken() {
        when(tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(anyString(), any(OffsetDateTime.class)))
            .thenReturn(Optional.empty());

        boolean result = verificationService.verifyEmail("expired-token");

        assertFalse(result);
        verify(tokenRepository, never()).save(any(VerificationToken.class));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should reject already used token")
    void shouldRejectAlreadyUsedToken() {
        when(tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(anyString(), any(OffsetDateTime.class)))
            .thenReturn(Optional.empty());

        boolean result = verificationService.verifyEmail("used-token");

        assertFalse(result);
    }

    @Test
    @DisplayName("Should reject wrong token type for email verification")
    void shouldRejectWrongTokenType() {
        VerificationToken passwordResetToken = new VerificationToken(
            testUser,
            "password-reset-token",
            TokenType.PASSWORD_RESET,
            OffsetDateTime.now().plusHours(1),
            "127.0.0.1"
        );

        when(tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(anyString(), any(OffsetDateTime.class)))
            .thenReturn(Optional.of(passwordResetToken));

        boolean result = verificationService.verifyEmail("password-reset-token");

        assertFalse(result);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should create password reset token for existing user")
    void shouldCreatePasswordResetForExistingUser() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(valueOperations.get(anyString())).thenReturn(null);
        doNothing().when(valueOperations).set(anyString(), any(), anyLong(), any());
        doNothing().when(tokenRepository).deleteByUserIdAndTokenType(any(UUID.class), any(TokenType.class));
        when(tokenRepository.save(any(VerificationToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(emailService).sendPasswordResetEmail(anyString(), anyString());

        verificationService.createAndSendPasswordReset(testUser.getEmail(), "127.0.0.1");

        verify(tokenRepository).deleteByUserIdAndTokenType(testUser.getId(), TokenType.PASSWORD_RESET);
        verify(tokenRepository).save(any(VerificationToken.class));
        verify(emailService).sendPasswordResetEmail(eq(testUser.getEmail()), anyString());
    }

    @Test
    @DisplayName("Should not reveal if email does not exist")
    void shouldNotRevealNonExistentEmail() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> {
            verificationService.createAndSendPasswordReset("nonexistent@example.com", "127.0.0.1");
        });

        verify(tokenRepository, never()).save(any(VerificationToken.class));
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Should enforce rate limit for password reset")
    void shouldEnforceRateLimitForPasswordReset() {
        when(userRepository.findByEmail(testUser.getEmail())).thenReturn(Optional.of(testUser));
        when(valueOperations.get(anyString())).thenReturn(OffsetDateTime.now());

        verificationService.createAndSendPasswordReset(testUser.getEmail(), "127.0.0.1");

        verify(tokenRepository, never()).save(any(VerificationToken.class));
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("Should validate valid password reset token")
    void shouldValidateValidPasswordResetToken() {
        VerificationToken token = new VerificationToken(
            testUser,
            "reset-token",
            TokenType.PASSWORD_RESET,
            OffsetDateTime.now().plusHours(1),
            "127.0.0.1"
        );

        when(tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(anyString(), any(OffsetDateTime.class)))
            .thenReturn(Optional.of(token));

        Optional<User> result = verificationService.validatePasswordResetToken("reset-token");

        assertTrue(result.isPresent());
        assertEquals(testUser.getId(), result.get().getId());
    }

    @Test
    @DisplayName("Should reject invalid password reset token")
    void shouldRejectInvalidPasswordResetToken() {
        when(tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(anyString(), any(OffsetDateTime.class)))
            .thenReturn(Optional.empty());

        Optional<User> result = verificationService.validatePasswordResetToken("invalid-token");

        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should reject wrong token type for password reset")
    void shouldRejectWrongTokenTypeForPasswordReset() {
        VerificationToken emailToken = new VerificationToken(
            testUser,
            "email-token",
            TokenType.EMAIL_VERIFICATION,
            OffsetDateTime.now().plusHours(24),
            "127.0.0.1"
        );

        when(tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(anyString(), any(OffsetDateTime.class)))
            .thenReturn(Optional.of(emailToken));

        Optional<User> result = verificationService.validatePasswordResetToken("email-token");

        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("Should reset password with valid token")
    void shouldResetPasswordWithValidToken() {
        VerificationToken token = new VerificationToken(
            testUser,
            "reset-token",
            TokenType.PASSWORD_RESET,
            OffsetDateTime.now().plusHours(1),
            "127.0.0.1"
        );

        when(tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(eq("reset-token"), any(OffsetDateTime.class)))
            .thenReturn(Optional.of(token));
        doNothing().when(authService).updatePassword(any(User.class), anyString());
        when(tokenRepository.save(any(VerificationToken.class))).thenReturn(token);
        doNothing().when(tokenRepository).deleteByUserIdAndTokenType(any(UUID.class), any(TokenType.class));

        assertDoesNotThrow(() -> {
            verificationService.resetPasswordWithToken("reset-token", "NewPassword123!");
        });

        verify(authService).updatePassword(testUser, "NewPassword123!");
        verify(tokenRepository).save(token);
        verify(tokenRepository).deleteByUserIdAndTokenType(testUser.getId(), TokenType.PASSWORD_RESET);
    }

    @Test
    @DisplayName("Should throw exception for invalid token in password reset")
    void shouldThrowExceptionForInvalidTokenInPasswordReset() {
        when(tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(anyString(), any(OffsetDateTime.class)))
            .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            verificationService.resetPasswordWithToken("invalid-token", "NewPassword123!");
        });

        verify(authService, never()).updatePassword(any(User.class), anyString());
    }

    @Test
    @DisplayName("Should mark token as used after password reset")
    void shouldMarkTokenAsUsedAfterPasswordReset() {
        VerificationToken token = new VerificationToken(
            testUser,
            "reset-token",
            TokenType.PASSWORD_RESET,
            OffsetDateTime.now().plusHours(1),
            "127.0.0.1"
        );

        when(tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(eq("reset-token"), any(OffsetDateTime.class)))
            .thenReturn(Optional.of(token));
        when(tokenRepository.save(any(VerificationToken.class))).thenReturn(token);
        doNothing().when(tokenRepository).deleteByUserIdAndTokenType(any(UUID.class), any(TokenType.class));

        verificationService.markPasswordResetTokenAsUsed("reset-token");

        assertNotNull(token.getUsedAt());
        verify(tokenRepository).save(token);
        verify(tokenRepository).deleteByUserIdAndTokenType(testUser.getId(), TokenType.PASSWORD_RESET);
    }
}
