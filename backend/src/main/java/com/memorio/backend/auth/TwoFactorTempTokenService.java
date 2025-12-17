package com.memorio.backend.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
public class TwoFactorTempTokenService {
    private static final Logger log = LoggerFactory.getLogger(TwoFactorTempTokenService.class);

    private static final int TEMP_TOKEN_MINUTES = 5;

    private final SecretKey key;
    private final String issuer;

    public TwoFactorTempTokenService(
            @Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.issuer}") String issuer

    ){
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32){
            throw new IllegalArgumentException("JWT secret must be at least32 bytes");
        }

        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.issuer = issuer;
        log.info("TwoFactorTempTokenService initialized (token TTL: {} minutes)", TEMP_TOKEN_MINUTES);

    }

    public String generateTempToken(UUID userId){
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(TEMP_TOKEN_MINUTES * 60);
        String token = Jwts.builder()
                .setSubject(userId.toString())
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .claim("typ", "2fa-temp")
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();

        log.debug("Generated temporary 2FA token for user: {} (expires in {} minutes)",
                userId, TEMP_TOKEN_MINUTES);

        return token;
    }

    public UUID validateTempToken(String token) throws JwtException{
        try{
            Jws<Claims> parsed = Jwts.parserBuilder()
                    .requireIssuer(issuer)
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token);

            Claims claims = parsed.getBody();

            String typ = claims.get("typ", String.class);
            if (typ == null || !"2fa-temp".equals(typ)) {
                log.warn("Token validation failed: wrong token type (expected 2fa-temp, got {})", typ);
                throw new JwtException("Invalid token type");
            }

            UUID userId = UUID.fromString(claims.getSubject());
            log.debug("Temporary 2FA token validated successfully for user: {}", userId);
            return userId;
        }catch (ExpiredJwtException e){
            log.warn("Temporary 2FA token expired");
            throw new JwtException("Token expired - please login again");
        } catch (JwtException e){
            log.warn("Temporary 2FA token validation failed: {}", e.getMessage());
            throw e;
        }
    }

}
