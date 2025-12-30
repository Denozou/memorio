package com.memorio.backend.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JwtService Unit Tests")
class JwtServiceTest {

    private JwtService jwtService;
    private static final String TEST_SECRET = "test-secret-key-minimum-32-bytes-long-for-security";
    private static final String TEST_ISSUER = "memorio-test";
    private static final long ACCESS_TOKEN_MINUTES = 60;
    private static final long REFRESH_TOKEN_MINUTES = 10080;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(TEST_SECRET, TEST_ISSUER, ACCESS_TOKEN_MINUTES, REFRESH_TOKEN_MINUTES);
    }

    @Test
    @DisplayName("Should throw exception when secret is too short")
    void shouldRejectShortSecret() {
        assertThrows(IllegalArgumentException.class, () -> {
            new JwtService("short", TEST_ISSUER, ACCESS_TOKEN_MINUTES, REFRESH_TOKEN_MINUTES);
        });
    }

    @Test
    @DisplayName("Should generate valid access token")
    void shouldGenerateValidAccessToken() {
        String userId = "123e4567-e89b-12d3-a456-426614174000";
        String email = "test@example.com";
        List<String> roles = List.of("USER");

        String token = jwtService.generateAccessToken(userId, email, roles);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        
        Claims claims = jwtService.parseClaims(token);
        assertEquals(userId, claims.getSubject());
        assertEquals(email, claims.get("email"));
        assertEquals("access", claims.get("typ"));
        assertEquals(TEST_ISSUER, claims.getIssuer());
    }

    @Test
    @DisplayName("Should generate valid refresh token")
    void shouldGenerateValidRefreshToken() {
        String userId = "123e4567-e89b-12d3-a456-426614174000";

        String token = jwtService.generateRefreshToken(userId);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        
        Claims claims = jwtService.parseClaims(token);
        assertEquals(userId, claims.getSubject());
        assertEquals("refresh", claims.get("typ"));
        assertEquals(TEST_ISSUER, claims.getIssuer());
    }

    @Test
    @DisplayName("Should validate and extract subject from token")
    void shouldValidateAndExtractSubject() {
        String userId = "123e4567-e89b-12d3-a456-426614174000";
        String token = jwtService.generateRefreshToken(userId);

        String extractedSubject = jwtService.validateAndGetSubject(token);

        assertEquals(userId, extractedSubject);
    }

    @Test
    @DisplayName("Should throw exception for invalid token")
    void shouldRejectInvalidToken() {
        String invalidToken = "invalid.jwt.token";

        assertThrows(JwtException.class, () -> {
            jwtService.parseClaims(invalidToken);
        });
    }

    @Test
    @DisplayName("Should throw exception for tampered token")
    void shouldRejectTamperedToken() {
        String userId = "123e4567-e89b-12d3-a456-426614174000";
        String token = jwtService.generateRefreshToken(userId);
        
        String tamperedToken = token.substring(0, token.length() - 5) + "XXXXX";

        assertThrows(JwtException.class, () -> {
            jwtService.parseClaims(tamperedToken);
        });
    }

    @Test
    @DisplayName("Should get correct expiration time from token")
    void shouldGetExpirationTime() {
        String userId = "123e4567-e89b-12d3-a456-426614174000";
        String email = "test@example.com";
        List<String> roles = List.of("USER");

        Instant beforeGeneration = Instant.now();
        String token = jwtService.generateAccessToken(userId, email, roles);
        Instant afterGeneration = Instant.now();

        Instant expiration = jwtService.getExpiration(token);

        assertNotNull(expiration);
        assertTrue(expiration.isAfter(beforeGeneration.plusSeconds(ACCESS_TOKEN_MINUTES * 60 - 5)));
        assertTrue(expiration.isBefore(afterGeneration.plusSeconds(ACCESS_TOKEN_MINUTES * 60 + 5)));
    }

    @Test
    @DisplayName("Should include all required claims in access token")
    void shouldIncludeAllClaimsInAccessToken() {
        String userId = "123e4567-e89b-12d3-a456-426614174000";
        String email = "test@example.com";
        List<String> roles = List.of("USER", "ADMIN");

        String token = jwtService.generateAccessToken(userId, email, roles);
        Claims claims = jwtService.parseClaims(token);

        assertAll(
            () -> assertEquals(userId, claims.getSubject()),
            () -> assertEquals(email, claims.get("email")),
            () -> assertEquals("access", claims.get("typ")),
            () -> assertEquals(TEST_ISSUER, claims.getIssuer()),
            () -> assertNotNull(claims.getIssuedAt()),
            () -> assertNotNull(claims.getExpiration()),
            () -> assertTrue(claims.getExpiration().after(claims.getIssuedAt()))
        );
    }

    @Test
    @DisplayName("Should handle multiple roles in access token")
    void shouldHandleMultipleRoles() {
        String userId = "123e4567-e89b-12d3-a456-426614174000";
        String email = "test@example.com";
        List<String> roles = List.of("USER", "ADMIN", "MODERATOR");

        String token = jwtService.generateAccessToken(userId, email, roles);
        Claims claims = jwtService.parseClaims(token);

        @SuppressWarnings("unchecked")
        List<String> extractedRoles = (List<String>) claims.get("roles");
        
        assertEquals(3, extractedRoles.size());
        assertTrue(extractedRoles.containsAll(roles));
    }

    @Test
    @DisplayName("Should differentiate between access and refresh tokens")
    void shouldDifferentiateBetweenTokenTypes() {
        String userId = "123e4567-e89b-12d3-a456-426614174000";
        
        String accessToken = jwtService.generateAccessToken(userId, "test@example.com", List.of("USER"));
        String refreshToken = jwtService.generateRefreshToken(userId);

        Claims accessClaims = jwtService.parseClaims(accessToken);
        Claims refreshClaims = jwtService.parseClaims(refreshToken);

        assertEquals("access", accessClaims.get("typ"));
        assertEquals("refresh", refreshClaims.get("typ"));
        assertNotNull(accessClaims.get("email"));
        assertNull(refreshClaims.get("email"));
    }

    @Test
    @DisplayName("Should generate different tokens for same user when generated at different times")
    void shouldGenerateDifferentTokensForSameUser() throws InterruptedException {
        String userId = "123e4567-e89b-12d3-a456-426614174000";

        String token1 = jwtService.generateRefreshToken(userId);
        // JWT uses second-level precision for iat, so we need to wait at least 1 second
        Thread.sleep(1100);
        String token2 = jwtService.generateRefreshToken(userId);

        assertNotEquals(token1, token2, "Tokens should be different when generated at different times");
    }
}
