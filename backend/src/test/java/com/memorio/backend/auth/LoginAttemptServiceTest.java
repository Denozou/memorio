package com.memorio.backend.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("LoginAttemptService Unit Tests")
class LoginAttemptServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    private LoginAttemptService loginAttemptService;

    private static final String TEST_EMAIL = "test@example.com";
    private static final String KEY_PREFIX = "login-attempt:";

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        loginAttemptService = new LoginAttemptService(redisTemplate);
    }

    @Test
    @DisplayName("Should clear login attempts on successful login")
    void shouldClearAttemptsOnSuccess() {
        loginAttemptService.loginSucceeded(TEST_EMAIL);

        verify(redisTemplate).delete(KEY_PREFIX + TEST_EMAIL);
    }

    @Test
    @DisplayName("Should increment attempts on failed login")
    void shouldIncrementAttemptsOnFailure() {
        when(valueOperations.get(KEY_PREFIX + TEST_EMAIL)).thenReturn(null);

        loginAttemptService.loginFailed(TEST_EMAIL);

        ArgumentCaptor<LoginAttemptService.LoginAttempt> captor =
            ArgumentCaptor.forClass(LoginAttemptService.LoginAttempt.class);
        verify(valueOperations).set(
            eq(KEY_PREFIX + TEST_EMAIL),
            captor.capture(),
            eq(20L),
            eq(TimeUnit.MINUTES)
        );

        assertEquals(1, captor.getValue().getAttempts());
        assertNull(captor.getValue().getLockedUntil());
    }

    @Test
    @DisplayName("Should accumulate failed attempts")
    void shouldAccumulateFailedAttempts() {
        LoginAttemptService.LoginAttempt existingAttempt = new LoginAttemptService.LoginAttempt();
        existingAttempt.setAttempts(3);
        when(valueOperations.get(KEY_PREFIX + TEST_EMAIL)).thenReturn(existingAttempt);

        loginAttemptService.loginFailed(TEST_EMAIL);

        ArgumentCaptor<LoginAttemptService.LoginAttempt> captor =
            ArgumentCaptor.forClass(LoginAttemptService.LoginAttempt.class);
        verify(valueOperations).set(
            eq(KEY_PREFIX + TEST_EMAIL),
            captor.capture(),
            eq(20L),
            eq(TimeUnit.MINUTES)
        );

        assertEquals(4, captor.getValue().getAttempts());
        assertNull(captor.getValue().getLockedUntil());
    }

    @Test
    @DisplayName("Should lock account after 5 failed attempts")
    void shouldLockAccountAfterMaxAttempts() {
        LoginAttemptService.LoginAttempt existingAttempt = new LoginAttemptService.LoginAttempt();
        existingAttempt.setAttempts(4);
        when(valueOperations.get(KEY_PREFIX + TEST_EMAIL)).thenReturn(existingAttempt);

        loginAttemptService.loginFailed(TEST_EMAIL);

        ArgumentCaptor<LoginAttemptService.LoginAttempt> captor =
            ArgumentCaptor.forClass(LoginAttemptService.LoginAttempt.class);
        verify(valueOperations).set(
            eq(KEY_PREFIX + TEST_EMAIL),
            captor.capture(),
            eq(20L),
            eq(TimeUnit.MINUTES)
        );

        assertEquals(5, captor.getValue().getAttempts());
        assertNotNull(captor.getValue().getLockedUntil());
    }

    @Test
    @DisplayName("Should return false for non-blocked user")
    void shouldReturnFalseForNonBlockedUser() {
        when(valueOperations.get(KEY_PREFIX + TEST_EMAIL)).thenReturn(null);

        boolean result = loginAttemptService.isBlocked(TEST_EMAIL);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should return false when attempts exist but no lockout")
    void shouldReturnFalseWhenNotLocked() {
        LoginAttemptService.LoginAttempt attempt = new LoginAttemptService.LoginAttempt();
        attempt.setAttempts(3);
        when(valueOperations.get(KEY_PREFIX + TEST_EMAIL)).thenReturn(attempt);

        boolean result = loginAttemptService.isBlocked(TEST_EMAIL);

        assertFalse(result);
    }

    @Test
    @DisplayName("Should return true when account is locked")
    void shouldReturnTrueWhenLocked() {
        LoginAttemptService.LoginAttempt attempt = new LoginAttemptService.LoginAttempt();
        attempt.setAttempts(5);
        attempt.setLockedUntil(LocalDateTime.now().plusMinutes(10));
        when(valueOperations.get(KEY_PREFIX + TEST_EMAIL)).thenReturn(attempt);

        boolean result = loginAttemptService.isBlocked(TEST_EMAIL);

        assertTrue(result);
    }

    @Test
    @DisplayName("Should return false and clear data when lockout expired")
    void shouldReturnFalseWhenLockoutExpired() {
        LoginAttemptService.LoginAttempt attempt = new LoginAttemptService.LoginAttempt();
        attempt.setAttempts(5);
        attempt.setLockedUntil(LocalDateTime.now().minusMinutes(1));
        when(valueOperations.get(KEY_PREFIX + TEST_EMAIL)).thenReturn(attempt);

        boolean result = loginAttemptService.isBlocked(TEST_EMAIL);

        assertFalse(result);
        verify(redisTemplate).delete(KEY_PREFIX + TEST_EMAIL);
    }

    @Test
    @DisplayName("LoginAttempt should have default values")
    void loginAttemptShouldHaveDefaultValues() {
        LoginAttemptService.LoginAttempt attempt = new LoginAttemptService.LoginAttempt();

        assertEquals(0, attempt.getAttempts());
        assertNull(attempt.getLockedUntil());
    }

    @Test
    @DisplayName("LoginAttempt increment should work correctly")
    void loginAttemptIncrementShouldWork() {
        LoginAttemptService.LoginAttempt attempt = new LoginAttemptService.LoginAttempt();

        attempt.incrementAttempts();
        assertEquals(1, attempt.getAttempts());

        attempt.incrementAttempts();
        assertEquals(2, attempt.getAttempts());
    }

    @Test
    @DisplayName("LoginAttempt setters should work correctly")
    void loginAttemptSettersShouldWork() {
        LoginAttemptService.LoginAttempt attempt = new LoginAttemptService.LoginAttempt();
        LocalDateTime lockTime = LocalDateTime.now().plusMinutes(15);

        attempt.setAttempts(5);
        attempt.setLockedUntil(lockTime);

        assertEquals(5, attempt.getAttempts());
        assertEquals(lockTime, attempt.getLockedUntil());
    }
}
