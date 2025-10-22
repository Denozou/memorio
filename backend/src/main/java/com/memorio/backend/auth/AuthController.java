package com.memorio.backend.auth;
import com.memorio.backend.auth.dto.LoginRequest;
import com.memorio.backend.auth.dto.AuthSuccessResponse;
import com.memorio.backend.auth.dto.RefreshResponse;
import com.memorio.backend.auth.dto.CheckAuthResponse;
import com.memorio.backend.auth.dto.LogoutResponse;
import com.memorio.backend.auth.dto.UserInfoDto;
import com.memorio.backend.auth.dto.RegisterRequest;
import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.common.security.JwtService;
import com.memorio.backend.auth.dto.ErrorResponse;
import com.memorio.backend.common.security.RateLimitService;
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
    private final RateLimitService rateLimitService;
    public AuthController (AuthService auth, JwtService jwt,
                           CookieUtil cookieUtil, RateLimitService rateLimitService){
        this.auth = auth;
        this.jwt = jwt;
        this.cookieUtil = cookieUtil;
        this.rateLimitService = rateLimitService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpServletRequest request, HttpServletResponse response) {

       if(!rateLimitService.allowLogin(request)){
           return ResponseEntity.status(429)
                   .body(new ErrorResponse("Too many login attempts. Please try again later"));
       }

        boolean ok = auth.checkCredentials(req.getEmail(), req.getPassword());
        if (!ok) {
            return ResponseEntity.status(401).body(
                    new ErrorResponse("Invalid email or password")
            );
        }

        var user = auth.findByEmail(req.getEmail()).orElseThrow(); // should exist since creds are ok
        String subject = user.getId().toString();
        String access = jwt.generateAccessToken(subject, user.getEmail(), List.of(user.getRole().name()));
        String refresh = jwt.generateRefreshToken(subject);


        cookieUtil.setAccessTokenCookie(response, access);
        cookieUtil.setRefreshTokenCookie(response, refresh);

        UserInfoDto userInfo = new UserInfoDto(
                user.getId(),
                user.getEmail(),
                user.getDisplayName() != null ? user.getDisplayName() : user.getEmail(),
                user.getRole().name()
        );
        return  ResponseEntity.ok(
                new AuthSuccessResponse("Login successful", userInfo)
        );
    }
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {

        if(!rateLimitService.allowRefresh(request)){
            return ResponseEntity.status(429)
                    .body(new ErrorResponse("Too many refresh attempts. Please try again later."));
        }

        String refreshToken = cookieUtil.getRefreshTokenFromCookies(request);
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(
                    new ErrorResponse("Invalid email or password")
            );
        }

        try {
            var claims = jwt.parseClaims(refreshToken); // validates signature+exp+issuer
            String typ = String.valueOf(claims.get("typ"));
            if (!"refresh".equals(typ)) {
                return ResponseEntity.status(401).body(null);
            }

            var userId = UUID.fromString(claims.getSubject());
            var user = auth.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            String newAccess = jwt.generateAccessToken(
                    user.getId().toString(), user.getEmail(), List.of(user.getRole().name())
            );
            String newRefresh = jwt.generateRefreshToken(user.getId().toString());

            cookieUtil.setAccessTokenCookie(response, newAccess);
            cookieUtil.setRefreshTokenCookie(response, newRefresh);

            return ResponseEntity.ok(
                new RefreshResponse("Token refreshed successfully")
            );
        } catch (JwtException | IllegalArgumentException e) {
            // signature/expired/malformed
            cookieUtil.clearAuthCookies(response);
            return ResponseEntity.status(401).body(null);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request,HttpServletRequest httpRequest,HttpServletResponse response){

        if(!rateLimitService.allowRegister(httpRequest)){
            return ResponseEntity.status(429)
                    .body(new ErrorResponse("Too many registration attempts. Please try againn later."));
        }

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

        UserInfoDto userInfo = new UserInfoDto(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name()
        );

        return ResponseEntity.ok(new AuthSuccessResponse("Registration successful", userInfo));
    }

    @GetMapping("/check")
    public ResponseEntity<?> checkAuth(HttpServletRequest request){
        String token = cookieUtil.getAccessTokenFromCookies(request);
        if (token == null){
            return ResponseEntity.status(401).body(
                    new ErrorResponse("Invalid email or password")
            );

        }

        try{
            var claims = jwt.parseClaims(token);
            var userId = UUID.fromString(claims.getSubject());
            var user = auth.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
            UserInfoDto userInfo = new UserInfoDto(
              user.getId(),
              user.getEmail(),
              user.getDisplayName(),
              user.getRole().name()
            );
            return ResponseEntity.ok(
                    new CheckAuthResponse(true, userInfo)
            );
        }catch (JwtException | IllegalArgumentException e){
            return ResponseEntity.status(401).body(null);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponse> logout(HttpServletResponse response){
        cookieUtil.clearAuthCookies(response);
        return ResponseEntity.ok(
                new LogoutResponse("Logged out successfully")
        );
    }


}
