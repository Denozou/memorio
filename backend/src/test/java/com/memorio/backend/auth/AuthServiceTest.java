package com.memorio.backend.auth;

import com.memorio.backend.common.error.DuplicateEmailException;
import com.memorio.backend.user.User;
import com.memorio.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User testUser;
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_PASSWORD = "ValidPassword123!";
    private static final String TEST_HASH = "$2a$10$hashedPassword";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail(TEST_EMAIL);
        testUser.setPasswordHash(TEST_HASH);
        testUser.setDisplayName("Test User");
    }

    @Test
    @DisplayName("Should return true for valid credentials")
    void shouldReturnTrueForValidCredentials() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(TEST_PASSWORD, TEST_HASH)).thenReturn(true);

        boolean result = authService.checkCredentials(TEST_EMAIL, TEST_PASSWORD);

        assertTrue(result);
        verify(userRepository).findByEmail(TEST_EMAIL);
        verify(passwordEncoder).matches(TEST_PASSWORD, TEST_HASH);
    }

    @Test
    @DisplayName("Should return false for invalid password")
    void shouldReturnFalseForInvalidPassword() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", TEST_HASH)).thenReturn(false);

        boolean result = authService.checkCredentials(TEST_EMAIL, "wrongPassword");

        assertFalse(result);
        verify(userRepository).findByEmail(TEST_EMAIL);
        verify(passwordEncoder).matches("wrongPassword", TEST_HASH);
    }

    @Test
    @DisplayName("Should return false for non-existent email")
    void shouldReturnFalseForNonExistentEmail() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        boolean result = authService.checkCredentials("nonexistent@example.com", TEST_PASSWORD);

        assertFalse(result);
        verify(userRepository).findByEmail("nonexistent@example.com");
        verify(passwordEncoder).matches(eq(TEST_PASSWORD), anyString());
    }

    @Test
    @DisplayName("Should prevent timing attacks by always checking password")
    void shouldPreventTimingAttacks() {
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        authService.checkCredentials("nonexistent@example.com", TEST_PASSWORD);

        verify(passwordEncoder).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("Should find user by email")
    void shouldFindUserByEmail() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(testUser));

        Optional<User> result = authService.findByEmail(TEST_EMAIL);

        assertTrue(result.isPresent());
        assertEquals(TEST_EMAIL, result.get().getEmail());
        verify(userRepository).findByEmail(TEST_EMAIL);
    }

    @Test
    @DisplayName("Should find user by ID")
    void shouldFindUserById() {
        UUID userId = testUser.getId();
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        Optional<User> result = authService.findById(userId);

        assertTrue(result.isPresent());
        assertEquals(userId, result.get().getId());
        verify(userRepository).findById(userId);
    }

    @Test
    @DisplayName("Should register new user successfully")
    void shouldRegisterNewUserSuccessfully() {
        String displayName = "New User";
        String email = "new@example.com";
        String password = "ValidPassword123!";
        String language = "en";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(password)).thenReturn(TEST_HASH);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        User result = authService.registerUser(displayName, email, password, language);

        assertNotNull(result);
        assertEquals(email, result.getEmail());
        assertEquals(displayName, result.getDisplayName());
        assertFalse(result.isEmailVerified());
        verify(userRepository).findByEmail(email);
        verify(passwordEncoder).encode(password);
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when registering duplicate email")
    void shouldThrowExceptionForDuplicateEmail() {
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(testUser));

        assertThrows(DuplicateEmailException.class, () -> {
            authService.registerUser("New User", TEST_EMAIL, TEST_PASSWORD, "en");
        });

        verify(userRepository).findByEmail(TEST_EMAIL);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception for null display name")
    void shouldThrowExceptionForNullDisplayName() {
        assertThrows(IllegalArgumentException.class, () -> {
            authService.registerUser(null, TEST_EMAIL, TEST_PASSWORD, "en");
        });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception for blank display name")
    void shouldThrowExceptionForBlankDisplayName() {
        assertThrows(IllegalArgumentException.class, () -> {
            authService.registerUser("  ", TEST_EMAIL, TEST_PASSWORD, "en");
        });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception for null email")
    void shouldThrowExceptionForNullEmail() {
        assertThrows(IllegalArgumentException.class, () -> {
            authService.registerUser("Test User", null, TEST_PASSWORD, "en");
        });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception for null password")
    void shouldThrowExceptionForNullPassword() {
        assertThrows(IllegalArgumentException.class, () -> {
            authService.registerUser("Test User", TEST_EMAIL, null, "en");
        });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should use default language when null provided")
    void shouldUseDefaultLanguageWhenNull() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn(TEST_HASH);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = authService.registerUser("Test", "test@test.com", TEST_PASSWORD, null);

        assertEquals("en", result.getPreferredLanguage());
    }

    @Test
    @DisplayName("Should update user password")
    void shouldUpdateUserPassword() {
        String newPassword = "NewValidPassword123!";
        String newHash = "$2a$10$newHashedPassword";

        when(passwordEncoder.encode(newPassword)).thenReturn(newHash);
        when(userRepository.save(testUser)).thenReturn(testUser);

        authService.updatePassword(testUser, newPassword);

        assertEquals(newHash, testUser.getPasswordHash());
        verify(passwordEncoder).encode(newPassword);
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should throw exception when updating password with null user")
    void shouldThrowExceptionForNullUserInPasswordUpdate() {
        assertThrows(IllegalArgumentException.class, () -> {
            authService.updatePassword(null, TEST_PASSWORD);
        });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when updating password with null password")
    void shouldThrowExceptionForNullPasswordInUpdate() {
        assertThrows(IllegalArgumentException.class, () -> {
            authService.updatePassword(testUser, null);
        });

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should save user")
    void shouldSaveUser() {
        when(userRepository.save(testUser)).thenReturn(testUser);

        User result = authService.saveUser(testUser);

        assertNotNull(result);
        assertEquals(testUser.getId(), result.getId());
        verify(userRepository).save(testUser);
    }
}
