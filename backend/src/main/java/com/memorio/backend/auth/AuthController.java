package com.memorio.backend.auth;
import com.memorio.backend.auth.dto.LoginRequest;
import com.memorio.backend.auth.dto.LoginResponse;
import com.memorio.backend.auth.dto.RegisterRequest;
import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.common.security.JwtService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService auth;
    private final JwtService jwt;
    private final CookieUtil cookieUtil;
    public AuthController (AuthService auth, JwtService jwt, CookieUtil cookieUtil){
        this.auth = auth;
        this.jwt = jwt;
        this.cookieUtil = cookieUtil;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        boolean ok = auth.checkCredentials(req.getEmail(), req.getPassword());
        if (!ok) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        var user = auth.findByEmail(req.getEmail()).orElseThrow(); // should exist since creds are ok
        String subject = user.getId().toString();
        String access = jwt.generateAccessToken(subject, user.getEmail(), List.of(user.getRole().name()));
        String refresh = jwt.generateRefreshToken(subject);


        cookieUtil.setAccessTokenCookie(response, access);
        cookieUtil.setRefreshTokenCookie(response, refresh);

        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "displayName", user.getDisplayName() != null ? user.getDisplayName() : user.getEmail(),
                        "role", user.getRole().name()
                )
        ));
    }
    // AuthController.java
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = cookieUtil.getRefreshTokenFromCookies(request);
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("error", "No refreshTokenFound"));
        }

        try {
            var claims = jwt.parseClaims(refreshToken); // validates signature+exp+issuer
            String typ = String.valueOf(claims.get("typ"));
            if (!"refresh".equals(typ)) {
                return ResponseEntity.status(401).body(Map.of("error", "invalid token type"));
            }

            var userId = UUID.fromString(claims.getSubject());
            var user = auth.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            String newAccess = jwt.generateAccessToken(
                    user.getId().toString(), user.getEmail(), List.of(user.getRole().name())
            );

            cookieUtil.setAccessTokenCookie(response, newAccess);


            return ResponseEntity.ok(Map.of(
                    "message", "Token refreshed successfully"
            ));
        } catch (JwtException | IllegalArgumentException e) {
            // signature/expired/malformed
            cookieUtil.clearAuthCookies(response);
            return ResponseEntity.status(401).body(Map.of("error", "invalid or expired refresh token"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request,HttpServletResponse response){


        var user = auth.registerUser(
                request.getDisplayName(),
                request.getEmail(),
                request.getPassword(),
                request.getPreferredLanguage()
        );
        String subject = user.getId().toString();
        String access = jwt.generateAccessToken(subject, user.getEmail(), List.of(user.getRole().name()));
        String refresh = jwt.generateRefreshToken(subject);

        cookieUtil.setAccessTokenCookie(response, access);
        cookieUtil.setRefreshTokenCookie(response, refresh);



        return ResponseEntity.ok(Map.of(
                "message", "Registration successful",
                "user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "displayName", user.getDisplayName(),
                        "role", user.getRole().name()
                )
        ));

    }

    @GetMapping("/check")
    public ResponseEntity<?> checkAuth(HttpServletRequest request){
        String token = cookieUtil.getAccessTokenFromCookies(request);
        if (token == null){
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        }

        try{
            var claims = jwt.parseClaims(token);
            var userId = UUID.fromString(claims.getSubject());
            var user = auth.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
            return ResponseEntity.ok(Map.of(
                    "authenticated", true,
                    "user", Map.of(
                            "id", user.getId(),
                            "email", user.getEmail(),
                            "displayName", user.getDisplayName(),
                            "role", user.getRole().name()
                    )
            ));
        }catch (JwtException | IllegalArgumentException e){
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response){
        cookieUtil.clearAuthCookies(response);
        return ResponseEntity.ok(Map.of("message","Logged out successfully"));
    }


}
