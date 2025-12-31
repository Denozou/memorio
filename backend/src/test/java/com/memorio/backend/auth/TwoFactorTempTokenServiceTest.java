package com.memorio.backend.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("TwoFactorTempTokenService Unit Tests")
class TwoFactorTempTokenServiceTest {

    private TwoFactorTempTokenService tokenService;
    private static final String TEST_SECRET = "test-secret-key-minimum-32-bytes-long-for-security";
    private static final String TEST_ISSUER = "memorio-test";

    @BeforeEach
    void setUp() {
        tokenService = new TwoFactorTempTokenService(TEST_SECRET, TEST_ISSUER);
    }

    @Test
    @DisplayName("Should throw exception when secret is too short")
    void shouldRejectShortSecret() {
        assertThrows(IllegalArgumentException.class, () -> {
            new TwoFactorTempTokenService("short", TEST_ISSUER);
        });
    }

    @Test
    @DisplayName("Should generate valid temp token")
    void shouldGenerateValidTempToken() {
        UUID userId = UUID.randomUUID();

        String token = tokenService.generateTempToken(userId);

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    @DisplayName("Should validate and return user ID from temp token")
    void shouldValidateAndReturnUserId() {
        UUID userId = UUID.randomUUID();
        String token = tokenService.generateTempToken(userId);

        UUID extractedUserId = tokenService.validateTempToken(token);

        assertEquals(userId, extractedUserId);
    }

    @Test
    @DisplayName("Should include 2fa-temp type in token")
    void shouldInclude2faTempType() {
        UUID userId = UUID.randomUUID();
        String token = tokenService.generateTempToken(userId);

        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        assertEquals("2fa-temp", claims.get("typ"));
    }

    @Test
    @DisplayName("Should include correct issuer in token")
    void shouldIncludeCorrectIssuer() {
        UUID userId = UUID.randomUUID();
        String token = tokenService.generateTempToken(userId);

        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        assertEquals(TEST_ISSUER, claims.getIssuer());
    }

    @Test
    @DisplayName("Should set expiration to 5 minutes")
    void shouldSetExpirationTo5Minutes() {
        UUID userId = UUID.randomUUID();
        Instant beforeGeneration = Instant.now();

        String token = tokenService.generateTempToken(userId);

        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        Instant expiration = claims.getExpiration().toInstant();
        long expectedMinutes = 5;

        assertTrue(expiration.isAfter(beforeGeneration.plusSeconds(expectedMinutes * 60 - 5)));
        assertTrue(expiration.isBefore(beforeGeneration.plusSeconds(expectedMinutes * 60 + 10)));
    }

    @Test
    @DisplayName("Should throw exception for invalid token")
    void shouldRejectInvalidToken() {
        assertThrows(JwtException.class, () -> {
            tokenService.validateTempToken("invalid.jwt.token");
        });
    }

    @Test
    @DisplayName("Should throw exception for tampered token")
    void shouldRejectTamperedToken() {
        UUID userId = UUID.randomUUID();
        String token = tokenService.generateTempToken(userId);
        String tamperedToken = token.substring(0, token.length() - 5) + "XXXXX";

        assertThrows(JwtException.class, () -> {
            tokenService.validateTempToken(tamperedToken);
        });
    }

    @Test
    @DisplayName("Should throw exception for wrong token type")
    void shouldRejectWrongTokenType() {
        UUID userId = UUID.randomUUID();
        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

        String wrongTypeToken = Jwts.builder()
                .setSubject(userId.toString())
                .setIssuer(TEST_ISSUER)
                .setIssuedAt(Date.from(Instant.now()))
                .setExpiration(Date.from(Instant.now().plusSeconds(300)))
                .claim("typ", "access")
                .signWith(key)
                .compact();

        JwtException exception = assertThrows(JwtException.class, () -> {
            tokenService.validateTempToken(wrongTypeToken);
        });

        assertEquals("Invalid token type", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw exception for token without type claim")
    void shouldRejectTokenWithoutType() {
        UUID userId = UUID.randomUUID();
        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

        String noTypeToken = Jwts.builder()
                .setSubject(userId.toString())
                .setIssuer(TEST_ISSUER)
                .setIssuedAt(Date.from(Instant.now()))
                .setExpiration(Date.from(Instant.now().plusSeconds(300)))
                .signWith(key)
                .compact();

        JwtException exception = assertThrows(JwtException.class, () -> {
            tokenService.validateTempToken(noTypeToken);
        });

        assertEquals("Invalid token type", exception.getMessage());
    }

    @Test
    @DisplayName("Should throw exception for expired token")
    void shouldRejectExpiredToken() {
        UUID userId = UUID.randomUUID();
        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

        String expiredToken = Jwts.builder()
                .setSubject(userId.toString())
                .setIssuer(TEST_ISSUER)
                .setIssuedAt(Date.from(Instant.now().minusSeconds(600)))
                .setExpiration(Date.from(Instant.now().minusSeconds(300)))
                .claim("typ", "2fa-temp")
                .signWith(key)
                .compact();

        JwtException exception = assertThrows(JwtException.class, () -> {
            tokenService.validateTempToken(expiredToken);
        });

        assertTrue(exception.getMessage().contains("Token expired"));
    }

    @Test
    @DisplayName("Should throw exception for wrong issuer")
    void shouldRejectWrongIssuer() {
        UUID userId = UUID.randomUUID();
        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

        String wrongIssuerToken = Jwts.builder()
                .setSubject(userId.toString())
                .setIssuer("wrong-issuer")
                .setIssuedAt(Date.from(Instant.now()))
                .setExpiration(Date.from(Instant.now().plusSeconds(300)))
                .claim("typ", "2fa-temp")
                .signWith(key)
                .compact();

        assertThrows(JwtException.class, () -> {
            tokenService.validateTempToken(wrongIssuerToken);
        });
    }

    @Test
    @DisplayName("Should generate unique tokens for same user")
    void shouldGenerateUniqueTokens() throws InterruptedException {
        UUID userId = UUID.randomUUID();

        String token1 = tokenService.generateTempToken(userId);
        Thread.sleep(1100); // JWT uses second precision for iat
        String token2 = tokenService.generateTempToken(userId);

        assertNotEquals(token1, token2);
    }

    @Test
    @DisplayName("Should generate different tokens for different users")
    void shouldGenerateDifferentTokensForDifferentUsers() {
        UUID userId1 = UUID.randomUUID();
        UUID userId2 = UUID.randomUUID();

        String token1 = tokenService.generateTempToken(userId1);
        String token2 = tokenService.generateTempToken(userId2);

        assertNotEquals(token1, token2);

        assertEquals(userId1, tokenService.validateTempToken(token1));
        assertEquals(userId2, tokenService.validateTempToken(token2));
    }
}
