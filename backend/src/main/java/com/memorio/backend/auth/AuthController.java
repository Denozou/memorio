package com.memorio.backend.auth;

import com.memorio.backend.auth.dto.LoginRequest;
import com.memorio.backend.auth.dto.LoginResponse;
import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.common.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService auth;
    private final JwtService jwt;
    public AuthController (AuthService auth, JwtService jwt){
        this.auth = auth;
        this.jwt = jwt;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        boolean ok = auth.checkCredentials(req.getEmail(), req.getPassword());
        if (!ok) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        var user = auth.findByEmail(req.getEmail()).orElseThrow(); // should exist since creds are ok
        String subject = user.getId().toString();
        String access = jwt.generateAccessToken(subject, user.getEmail(), List.of(user.getRole().name()));
        String refresh = jwt.generateRefreshToken(subject);
        Instant exp = jwt.getExpiration(access);

        return ResponseEntity.ok(new LoginResponse(access, exp, refresh));
    }
    // AuthController.java
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String refresh = body.get("refreshToken");
        if (refresh == null || refresh.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "refreshToken is required"));
        }

        try {
            var claims = jwt.parseClaims(refresh); // validates signature+exp+issuer
            String typ = String.valueOf(claims.get("typ"));
            if (!"refresh".equals(typ)) {
                return ResponseEntity.status(401).body(Map.of("error", "invalid token type"));
            }

            var userId = java.util.UUID.fromString(claims.getSubject());
            var user = auth.findById(userId)
                    .orElseThrow(() -> new com.memorio.backend.common.error.NotFoundException("User not found"));

            String newAccess = jwt.generateAccessToken(
                    user.getId().toString(), user.getEmail(), java.util.List.of(user.getRole().name())
            );
            var exp = jwt.getExpiration(newAccess);
            return ResponseEntity.ok(Map.of(
                    "accessToken", newAccess,
                    "expiresAt", exp.toString(),
                    "tokenType", "Bearer"
            ));
        } catch (io.jsonwebtoken.JwtException e) {
            // signature/expired/malformed
            return ResponseEntity.status(401).body(Map.of("error", "invalid or expired refresh token"));
        }
    }
}
