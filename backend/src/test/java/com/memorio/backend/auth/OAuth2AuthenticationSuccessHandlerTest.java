package com.memorio.backend.auth;

import com.memorio.backend.common.security.JwtService;
import com.memorio.backend.user.Role;
import com.memorio.backend.user.User;
import com.memorio.backend.user.UserIdentity;
import com.memorio.backend.user.UserIdentityRepository;
import com.memorio.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("OAuth2AuthenticationSuccessHandler Unit Tests")
class OAuth2AuthenticationSuccessHandlerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserIdentityRepository userIdentityRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private CookieUtil cookieUtil;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private Authentication authentication;

    @Mock
    private OAuth2User oauth2User;

    private OAuth2AuthenticationSuccessHandler handler;

    private static final String FRONTEND_URL = "http://localhost:3000";
    private static final String TEST_EMAIL = "oauth@example.com";
    private static final String TEST_NAME = "OAuth User";
    private static final String TEST_PICTURE = "https://example.com/picture.jpg";

    @BeforeEach
    void setUp() {
        handler = new OAuth2AuthenticationSuccessHandler(
                userRepository,
                userIdentityRepository,
                jwtService,
                cookieUtil,
                FRONTEND_URL
        );
    }

    @Test
    @DisplayName("Should create new user for Google OAuth login")
    void shouldCreateNewUserForGoogleOAuth() throws Exception {
        setupGoogleOAuth2User("google-user-123");
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/google");
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });
        when(userIdentityRepository.findByUserIdAndProvider(any(), eq("google")))
                .thenReturn(Optional.empty());
        when(userIdentityRepository.save(any(UserIdentity.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateAccessToken(anyString(), anyString(), anyList()))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        User savedUser = userCaptor.getValue();
        assertEquals(TEST_EMAIL, savedUser.getEmail());
        assertEquals(TEST_NAME, savedUser.getDisplayName());
        assertTrue(savedUser.isEmailVerified());
        assertEquals(Role.USER, savedUser.getRole());
        assertNull(savedUser.getPasswordHash());

        verify(response).sendRedirect(FRONTEND_URL + "/auth/oauth2/success");
    }

    @Test
    @DisplayName("Should link OAuth to existing user")
    void shouldLinkOAuthToExistingUser() throws Exception {
        setupGoogleOAuth2User("google-user-123");
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/google");

        User existingUser = createTestUser();
        existingUser.setEmailVerified(false);
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);
        when(userIdentityRepository.findByUserIdAndProvider(existingUser.getId(), "google"))
                .thenReturn(Optional.empty());
        when(userIdentityRepository.save(any(UserIdentity.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateAccessToken(anyString(), anyString(), anyList()))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        assertTrue(userCaptor.getValue().isEmailVerified());
    }

    @Test
    @DisplayName("Should update picture URL for existing user")
    void shouldUpdatePictureUrlForExistingUser() throws Exception {
        setupGoogleOAuth2User("google-user-123");
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/google");

        User existingUser = createTestUser();
        existingUser.setPictureUrl(null);
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);
        when(userIdentityRepository.findByUserIdAndProvider(existingUser.getId(), "google"))
                .thenReturn(Optional.empty());
        when(userIdentityRepository.save(any(UserIdentity.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateAccessToken(anyString(), anyString(), anyList()))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());

        assertEquals(TEST_PICTURE, userCaptor.getValue().getPictureUrl());
    }

    @Test
    @DisplayName("Should extract provider from Google OAuth callback URL")
    void shouldExtractGoogleProvider() throws Exception {
        setupGoogleOAuth2User("google-user-123");
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/google");
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });
        when(userIdentityRepository.findByUserIdAndProvider(any(), eq("google")))
                .thenReturn(Optional.empty());
        when(userIdentityRepository.save(any(UserIdentity.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateAccessToken(anyString(), anyString(), anyList()))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(userIdentityRepository).findByUserIdAndProvider(any(), eq("google"));
    }

    @Test
    @DisplayName("Should extract provider from Facebook OAuth callback URL")
    void shouldExtractFacebookProvider() throws Exception {
        setupFacebookOAuth2User("fb-user-123");
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/facebook");
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });
        when(userIdentityRepository.findByUserIdAndProvider(any(), eq("facebook")))
                .thenReturn(Optional.empty());
        when(userIdentityRepository.save(any(UserIdentity.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateAccessToken(anyString(), anyString(), anyList()))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(userIdentityRepository).findByUserIdAndProvider(any(), eq("facebook"));
    }

    @Test
    @DisplayName("Should set JWT cookies on successful OAuth")
    void shouldSetJwtCookies() throws Exception {
        setupGoogleOAuth2User("google-user-123");
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/google");

        User existingUser = createTestUser();
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);
        when(userIdentityRepository.findByUserIdAndProvider(existingUser.getId(), "google"))
                .thenReturn(Optional.of(createTestIdentity(existingUser, "google", "google-user-123")));
        when(jwtService.generateAccessToken(anyString(), anyString(), anyList()))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(cookieUtil).setAccessTokenCookie(response, "access-token");
        verify(cookieUtil).setRefreshTokenCookie(response, "refresh-token");
    }

    @Test
    @DisplayName("Should throw exception when OAuth email is missing")
    void shouldThrowExceptionWhenEmailMissing() {
        when(authentication.getPrincipal()).thenReturn(oauth2User);
        when(oauth2User.getAttribute("sub")).thenReturn("google-user-123");
        when(oauth2User.getAttribute("email")).thenReturn(null);
        when(oauth2User.getAttribute("name")).thenReturn(null);
        when(oauth2User.getAttribute("picture")).thenReturn(null);
        when(oauth2User.getAttribute("id")).thenReturn("google-user-123");
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/google");

        assertThrows(IllegalArgumentException.class, () -> {
            handler.onAuthenticationSuccess(request, response, authentication);
        });
    }

    @Test
    @DisplayName("Should throw exception when provider user ID mismatch")
    void shouldThrowExceptionOnProviderIdMismatch() {
        setupGoogleOAuth2User("new-google-id");
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/google");

        User existingUser = createTestUser();
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);

        UserIdentity existingIdentity = createTestIdentity(existingUser, "google", "old-google-id");
        when(userIdentityRepository.findByUserIdAndProvider(existingUser.getId(), "google"))
                .thenReturn(Optional.of(existingIdentity));

        assertThrows(IllegalArgumentException.class, () -> {
            handler.onAuthenticationSuccess(request, response, authentication);
        });
    }

    @Test
    @DisplayName("Should redirect to frontend success page")
    void shouldRedirectToFrontend() throws Exception {
        setupGoogleOAuth2User("google-user-123");
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/google");

        User existingUser = createTestUser();
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);
        when(userIdentityRepository.findByUserIdAndProvider(existingUser.getId(), "google"))
                .thenReturn(Optional.of(createTestIdentity(existingUser, "google", "google-user-123")));
        when(jwtService.generateAccessToken(anyString(), anyString(), anyList()))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(response).sendRedirect(FRONTEND_URL + "/auth/oauth2/success");
    }

    @Test
    @DisplayName("Should create user identity for new OAuth provider")
    void shouldCreateUserIdentityForNewProvider() throws Exception {
        setupGoogleOAuth2User("google-user-123");
        when(request.getRequestURI()).thenReturn("/login/oauth2/code/google");

        User existingUser = createTestUser();
        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(User.class))).thenReturn(existingUser);
        when(userIdentityRepository.findByUserIdAndProvider(existingUser.getId(), "google"))
                .thenReturn(Optional.empty());
        when(userIdentityRepository.save(any(UserIdentity.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateAccessToken(anyString(), anyString(), anyList()))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh-token");

        handler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<UserIdentity> identityCaptor = ArgumentCaptor.forClass(UserIdentity.class);
        verify(userIdentityRepository).save(identityCaptor.capture());

        UserIdentity savedIdentity = identityCaptor.getValue();
        assertEquals("google", savedIdentity.getProvider());
        assertEquals("google-user-123", savedIdentity.getProviderUserId());
    }

    private void setupGoogleOAuth2User(String providerId) {
        when(authentication.getPrincipal()).thenReturn(oauth2User);
        when(oauth2User.getAttribute("sub")).thenReturn(providerId);
        when(oauth2User.getAttribute("email")).thenReturn(TEST_EMAIL);
        when(oauth2User.getAttribute("name")).thenReturn(TEST_NAME);
        when(oauth2User.getAttribute("picture")).thenReturn(TEST_PICTURE);
    }

    private void setupFacebookOAuth2User(String providerId) {
        when(authentication.getPrincipal()).thenReturn(oauth2User);
        when(oauth2User.getAttribute("id")).thenReturn(providerId);
        when(oauth2User.getAttribute("email")).thenReturn(TEST_EMAIL);
        when(oauth2User.getAttribute("name")).thenReturn(TEST_NAME);
        when(oauth2User.getAttribute("picture")).thenReturn(
                Map.of("data", Map.of("url", TEST_PICTURE))
        );
    }

    private User createTestUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(TEST_EMAIL);
        user.setDisplayName(TEST_NAME);
        user.setRole(Role.USER);
        user.setEmailVerified(true);
        return user;
    }

    private UserIdentity createTestIdentity(User user, String provider, String providerId) {
        UserIdentity identity = new UserIdentity();
        identity.setUser(user);
        identity.setProvider(provider);
        identity.setProviderUserId(providerId);
        return identity;
    }
}
