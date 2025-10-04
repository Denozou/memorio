package com.memorio.backend.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;


@Service
public class JwtService {
    private final SecretKey key;
    private final String issuer;
    private final long accessTokenMinutes;
    private final long refreshTokenMinutes;

    public JwtService (@Value("${security.jwt.secret}") String secret,
                       @Value("${security.jwt.issuer}") String issuer,
                       @Value("${security.jwt.access-token-minutes}") long accessTokenMinutes,
                       @Value("${security.jwt.refresh-token-minutes:10080}") long refreshTokenMinutes){
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.accessTokenMinutes = accessTokenMinutes;
        this.refreshTokenMinutes = refreshTokenMinutes;
    }

    public String generateAccessToken(String subjectUuid,String email ,List<String> roles){
        return buildToken(subjectUuid, accessTokenMinutes, Map.of(
                "email", email,
                "roles", roles,
                "typ", "access"
        ));
    }
    private String buildToken(String subject, long ttlMinutes, Map<String, Object> claims){
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(ttlMinutes * 60);
        JwtBuilder b = Jwts.builder()
                .setSubject(subject)
                .setIssuer(issuer)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .signWith(key, SignatureAlgorithm.HS256);
        claims.forEach(b::claim);
        return b.compact();
    }
    public String generateRefreshToken(String subjectUuid) {
        return buildToken(subjectUuid, refreshTokenMinutes, Map.of("typ", "refresh"));
    }
    public String validateAndGetSubject(String token){
        Jws<Claims> parsed = Jwts.parserBuilder()
                .requireIssuer(issuer)
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
        return parsed.getBody().getSubject();
    }

    public Instant getExpiration (String token){
       return  parseClaims(token).getExpiration().toInstant();
    }


    public Claims parseClaims (String token){
        return Jwts.parserBuilder()
                .requireIssuer(issuer)
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }



}
