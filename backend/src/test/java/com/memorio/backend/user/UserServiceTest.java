package com.memorio.backend.user;

import com.memorio.backend.common.error.NotFoundException;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
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
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock
    private UserRepository users;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_PASSWORD = "password123";
    private static final String TEST_HASH = "$2a$10$hashedPassword";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail(TEST_EMAIL);
        testUser.setPasswordHash(TEST_HASH);
        testUser.setRole(Role.USER);
    }

    @Nested
    @DisplayName("countUsers tests")
    class CountUsersTests {

        @Test
        @DisplayName("Should return total user count")
        void shouldReturnTotalUserCount() {
            when(users.count()).thenReturn(100L);

            long result = userService.countUsers();

            assertEquals(100L, result);
            verify(users).count();
        }
    }

    @Nested
    @DisplayName("createUser tests")
    class CreateUserTests {

        @Test
        @DisplayName("Should create user successfully")
        void shouldCreateUserSuccessfully() {
            when(users.existsByEmail(TEST_EMAIL)).thenReturn(false);
            when(passwordEncoder.encode(TEST_PASSWORD)).thenReturn(TEST_HASH);
            when(users.save(any(User.class))).thenAnswer(invocation -> {
                User u = invocation.getArgument(0);
                u.setId(UUID.randomUUID());
                return u;
            });
            when(users.findById(any(UUID.class))).thenReturn(Optional.of(testUser));

            User result = userService.createUser(TEST_EMAIL, TEST_PASSWORD);

            assertNotNull(result);
            assertEquals(TEST_EMAIL, result.getEmail());
            verify(users).save(any(User.class));
            verify(users).flush();
        }

        @Test
        @DisplayName("Should throw exception for null email")
        void shouldThrowExceptionForNullEmail() {
            assertThrows(IllegalArgumentException.class, () ->
                    userService.createUser(null, TEST_PASSWORD));
            verify(users, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception for blank email")
        void shouldThrowExceptionForBlankEmail() {
            assertThrows(IllegalArgumentException.class, () ->
                    userService.createUser("   ", TEST_PASSWORD));
            verify(users, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception for null password")
        void shouldThrowExceptionForNullPassword() {
            assertThrows(IllegalArgumentException.class, () ->
                    userService.createUser(TEST_EMAIL, null));
            verify(users, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception for blank password")
        void shouldThrowExceptionForBlankPassword() {
            assertThrows(IllegalArgumentException.class, () ->
                    userService.createUser(TEST_EMAIL, "   "));
            verify(users, never()).save(any());
        }

        @Test
        @DisplayName("Should throw exception for existing email")
        void shouldThrowExceptionForExistingEmail() {
            when(users.existsByEmail(TEST_EMAIL)).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () ->
                    userService.createUser(TEST_EMAIL, TEST_PASSWORD));
            verify(users, never()).save(any());
        }
    }

    @Nested
    @DisplayName("getUser tests")
    class GetUserTests {

        @Test
        @DisplayName("Should return user by ID")
        void shouldReturnUserById() {
            UUID userId = testUser.getId();
            when(users.findById(userId)).thenReturn(Optional.of(testUser));

            User result = userService.getUser(userId);

            assertNotNull(result);
            assertEquals(userId, result.getId());
            verify(users).findById(userId);
        }

        @Test
        @DisplayName("Should throw NotFoundException for non-existent user")
        void shouldThrowNotFoundForNonExistentUser() {
            UUID fakeId = UUID.randomUUID();
            when(users.findById(fakeId)).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () ->
                    userService.getUser(fakeId));
        }

        @Test
        @DisplayName("Should throw exception for null ID")
        void shouldThrowExceptionForNullId() {
            assertThrows(IllegalArgumentException.class, () ->
                    userService.getUser(null));
        }
    }

    @Nested
    @DisplayName("getByEmail tests")
    class GetByEmailTests {

        @Test
        @DisplayName("Should return user by email")
        void shouldReturnUserByEmail() {
            when(users.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(testUser));

            User result = userService.getByEmail(TEST_EMAIL);

            assertNotNull(result);
            assertEquals(TEST_EMAIL, result.getEmail());
            verify(users).findByEmail(TEST_EMAIL);
        }

        @Test
        @DisplayName("Should throw NotFoundException for non-existent email")
        void shouldThrowNotFoundForNonExistentEmail() {
            when(users.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () ->
                    userService.getByEmail("nonexistent@example.com"));
        }

        @Test
        @DisplayName("Should throw exception for null email")
        void shouldThrowExceptionForNullEmail() {
            assertThrows(IllegalArgumentException.class, () ->
                    userService.getByEmail(null));
        }

        @Test
        @DisplayName("Should throw exception for blank email")
        void shouldThrowExceptionForBlankEmail() {
            assertThrows(IllegalArgumentException.class, () ->
                    userService.getByEmail("  "));
        }
    }

    @Nested
    @DisplayName("markTutorialCompleted tests")
    class MarkTutorialCompletedTests {

        @Test
        @DisplayName("Should mark tutorial as completed")
        void shouldMarkTutorialCompleted() {
            UUID userId = testUser.getId();
            when(users.findById(userId)).thenReturn(Optional.of(testUser));
            when(users.save(any(User.class))).thenReturn(testUser);

            userService.markTutorialCompleted(userId);

            verify(users).save(argThat(User::isTutorialCompleted));
        }

        @Test
        @DisplayName("Should throw NotFoundException for non-existent user")
        void shouldThrowNotFoundForNonExistentUser() {
            UUID fakeId = UUID.randomUUID();
            when(users.findById(fakeId)).thenReturn(Optional.empty());

            assertThrows(NotFoundException.class, () ->
                    userService.markTutorialCompleted(fakeId));
        }
    }
}
