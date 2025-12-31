package com.memorio.backend.auth;
import com.memorio.backend.auth.dto.LoginRequest;
import com.memorio.backend.auth.dto.AuthSuccessResponse;
import com.memorio.backend.auth.dto.RefreshResponse;
import com.memorio.backend.auth.dto.CheckAuthResponse;
import com.memorio.backend.auth.dto.LogoutResponse;
import com.memorio.backend.auth.dto.UserInfoDto;
import com.memorio.backend.auth.dto.RegisterRequest;
import com.memorio.backend.auth.dto.PasswordResetRequestDto;
import com.memorio.backend.auth.dto.PasswordResetConfirmDto;
import com.memorio.backend.auth.dto.MessageResponse;
import com.memorio.backend.common.error.DuplicateEmailException;
import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.common.security.JwtService;
import com.memorio.backend.auth.dto.ErrorResponse;
import com.memorio.backend.common.security.RateLimitService;
import com.memorio.backend.auth.dto.TwoFactorSetupResponse;
import com.memorio.backend.auth.dto.TwoFactorConfirmRequest;
import com.memorio.backend.auth.dto.TwoFactorVerifyRequest;
import com.memorio.backend.auth.dto.TwoFactorRequiredResponse;
import com.memorio.backend.auth.dto.TwoFactorDisableRequest;
import java.time.OffsetDateTime;
import java.time.Instant;
import io.jsonwebtoken.JwtException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication", description = "User authentication, registration, and two-factor authentication")
public class AuthController {
    private final AuthService auth;
    private final JwtService jwt;
    private final CookieUtil cookieUtil;
    private final RateLimitService rateLimitService;
    private final LoginAttemptService loginAttemptService;
    private final VerificationService verificationService;
    private final TwoFactorTempTokenService twoFactorTempTokenService;
    private final TwoFactorAuthService twoFactorAuthService;

    public AuthController (AuthService auth, JwtService jwt,
                           CookieUtil cookieUtil, RateLimitService rateLimitService, 
                           LoginAttemptService loginAttemptService, VerificationService verificationService,
                           TwoFactorTempTokenService twoFactorTempTokenService,
                           TwoFactorAuthService twoFactorAuthService){
        this.auth = auth;
        this.jwt = jwt;
        this.cookieUtil = cookieUtil;
        this.rateLimitService = rateLimitService;
        this.loginAttemptService = loginAttemptService;
        this.verificationService = verificationService;
        this.twoFactorTempTokenService = twoFactorTempTokenService;
        this.twoFactorAuthService = twoFactorAuthService;

    }

    @Operation(
        summary = "User login",
        description = "Authenticate user with email and password. Returns JWT tokens in cookies. If 2FA is enabled, returns a temporary token for 2FA verification."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Login successful or 2FA required",
            content = @Content(schema = @Schema(oneOf = {AuthSuccessResponse.class, TwoFactorRequiredResponse.class}))),
        @ApiResponse(responseCode = "401", description = "Invalid credentials"),
        @ApiResponse(responseCode = "403", description = "Account temporarily locked"),
        @ApiResponse(responseCode = "429", description = "Too many login attempts")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpServletRequest request, HttpServletResponse response) {

       if(!rateLimitService.allowLogin(request)){
           return ResponseEntity.status(429)
                   .body(new ErrorResponse("Too many login attempts. Please try again later"));
       }

       if(loginAttemptService.isBlocked(req.getEmail())){
           return ResponseEntity.status(403)
                   .body(new ErrorResponse("Account temporarily locked due to too many failed attempts." +
                           "Try again in 15 minutes"));
       }

        boolean ok = auth.checkCredentials(req.getEmail(), req.getPassword());
        if (!ok) {
            loginAttemptService.loginFailed(req.getEmail());
            return ResponseEntity.status(401).body(
                    new ErrorResponse("Invalid email or password")
            );
        }
        loginAttemptService.loginSucceeded(req.getEmail());
        var user = auth.findByEmail(req.getEmail()).orElseThrow(); // should exist since creds are ok
        if (user.isTwoFactorEnabled()) {
            String tempToken = twoFactorTempTokenService.generateTempToken(user.getId());
            return ResponseEntity.ok(
                    new TwoFactorRequiredResponse(tempToken)
            );
        }
        String subject = user.getId().toString();
        String access = jwt.generateAccessToken(subject, user.getEmail(), List.of(user.getRole().name()));
        String refresh = jwt.generateRefreshToken(subject);

        Instant expiresAt = jwt.getExpiration(access);

        cookieUtil.setAccessTokenCookie(response, access);
        cookieUtil.setRefreshTokenCookie(response, refresh);

        UserInfoDto userInfo = new UserInfoDto(
                user.getId(),
                user.getEmail(),
                user.getDisplayName() != null ? user.getDisplayName() : user.getEmail(),
                user.getRole().name()
        );
        return  ResponseEntity.ok(
                new AuthSuccessResponse("Login successful", userInfo, expiresAt.toEpochMilli())
        );
    }
    @Operation(
        summary = "Refresh access token",
        description = "Exchange refresh token (from cookie) for new access and refresh tokens."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Token refreshed",
            content = @Content(schema = @Schema(implementation = RefreshResponse.class))),
        @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token"),
        @ApiResponse(responseCode = "429", description = "Too many refresh attempts")
    })
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {

        if(!rateLimitService.allowRefresh(request)){
            return ResponseEntity.status(429)
                    .body(new ErrorResponse("Too many refresh attempts. Please try again later."));
        }

        String refreshToken = cookieUtil.getRefreshTokenFromCookies(request);
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(
                    new ErrorResponse("Missing or invalid refresh token")
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

            // Get expiration time for client-side tracking
            Instant expiresAt = jwt.getExpiration(newAccess);

            cookieUtil.setAccessTokenCookie(response, newAccess);
            cookieUtil.setRefreshTokenCookie(response, newRefresh);

            return ResponseEntity.ok(
               new RefreshResponse("Token refreshed successfully", expiresAt.toEpochMilli())
            );
        } catch (JwtException | IllegalArgumentException e) {
            // signature/expired/malformed
            cookieUtil.clearAuthCookies(response);
            return ResponseEntity.status(401).body(null);
        }
    }

    @Operation(
        summary = "Register new user",
        description = "Create a new user account. Sends email verification link. Returns JWT tokens in cookies."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Registration successful",
            content = @Content(schema = @Schema(implementation = AuthSuccessResponse.class))),
        @ApiResponse(responseCode = "409", description = "Email already exists"),
        @ApiResponse(responseCode = "429", description = "Too many registration attempts")
    })
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request,HttpServletRequest httpRequest,HttpServletResponse response){

        if(!rateLimitService.allowRegister(httpRequest)){
            return ResponseEntity.status(429)
                    .body(new ErrorResponse("Too many registration attempts. Please try againn later."));
        }
        try{
            var user = auth.registerUser(
                    request.getDisplayName(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getPreferredLanguage()
            );

            // Send email verification
            verificationService.createAndSendEmailVerification(user);

            String subject = user.getId().toString();
            String access = jwt.generateAccessToken(subject, user.getEmail(), List.of(user.getRole().name()));
            String refresh = jwt.generateRefreshToken(subject);
            
            Instant expiresAt = jwt.getExpiration(access);

            cookieUtil.setAccessTokenCookie(response, access);
            cookieUtil.setRefreshTokenCookie(response, refresh);

            UserInfoDto userInfo = new UserInfoDto(
                    user.getId(),
                    user.getEmail(),
                    user.getDisplayName(),
                    user.getRole().name()
            );

            return ResponseEntity.ok(new AuthSuccessResponse("Registration successful", userInfo, expiresAt.toEpochMilli()));
        }catch (DuplicateEmailException e){
            return ResponseEntity.status(409)
                    .body(new ErrorResponse("An account with this email already exists"));
        }catch (Exception e){
            return ResponseEntity.status(500)
                    .body(new ErrorResponse("Registration failed. Please try again later"));
        }


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

    @PostMapping("/resend-verification")
    public ResponseEntity<MessageResponse> resendVerification(HttpServletRequest request) {
        if (!rateLimitService.allowRegister(request)) {
            return ResponseEntity.status(429)
                    .body(new MessageResponse("Too many requests. Please try again later."));
        }

        String token = cookieUtil.getAccessTokenFromCookies(request);
        if (token == null) {
            return ResponseEntity.status(401)
                    .body(new MessageResponse("Authentication required"));
        }

        try {
            var claims = jwt.parseClaims(token);
            var userId = UUID.fromString(claims.getSubject());
            var user = auth.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            if (user.isEmailVerified()) {
                return ResponseEntity.badRequest()
                        .body(new MessageResponse("Email already verified"));
            }

            String clientIp = VerificationService.getClientIp(request);
            verificationService.createAndSendEmailVerification(user, clientIp);
            return ResponseEntity.ok(
                    new MessageResponse("Verification email sent successfully")
            );
        } catch (JwtException | IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body(new MessageResponse("Invalid authentication"));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(
            @RequestParam String token,
            HttpServletRequest request) {
        
        // Rate limiting to prevent token brute-force
        if (!rateLimitService.allowRegister(request)) {
            return ResponseEntity.status(429)
                    .body(new MessageResponse("Too many verification attempts. Please try again later."));
        }
        
        boolean success = verificationService.verifyEmail(token);
        
        if (success) {
            return ResponseEntity.ok(
                    new MessageResponse("Email verified successfully")
            );
        } else {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Invalid or expired verification token"));
        }
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<MessageResponse> requestPasswordReset(
            @Valid @RequestBody PasswordResetRequestDto request,
            HttpServletRequest httpRequest) {
        
        if (!rateLimitService.allowRegister(httpRequest)) {
            return ResponseEntity.status(429)
                    .body(new MessageResponse("Too many requests. Please try again later."));
        }

        // Always return success to prevent email enumeration
        String clientIp = VerificationService.getClientIp(httpRequest);
        verificationService.createAndSendPasswordReset(request.getEmail(), clientIp);
        return ResponseEntity.ok(
                new MessageResponse("If the email exists, a password reset link has been sent")
        );
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<MessageResponse> confirmPasswordReset(
            @Valid @RequestBody PasswordResetConfirmDto request,
            HttpServletRequest httpRequest) {

        if (!rateLimitService.allowRegister(httpRequest)) {
            return ResponseEntity.status(429)
                    .body(new MessageResponse("Too many requests. Please try again later."));
        }

        try {
            // Atomically reset password and mark token as used in a single transaction
            verificationService.resetPasswordWithToken(request.getToken(), request.getNewPassword());
            
            return ResponseEntity.ok(
                    new MessageResponse("Password reset successfully")
            );
        } catch (IllegalArgumentException e) {
            // Token validation failed or password validation failed
            return ResponseEntity.badRequest()
                    .body(new MessageResponse(e.getMessage()));
        } catch (Exception e) {
            // Unexpected error - transaction will be rolled back automatically
            return ResponseEntity.status(500)
                    .body(new MessageResponse("Failed to reset password. Please try again."));
        }
    }
    @Operation(
        summary = "Setup two-factor authentication",
        description = "Generate 2FA secret, QR code, and backup codes. Requires authentication."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "2FA setup data returned",
            content = @Content(schema = @Schema(implementation = TwoFactorSetupResponse.class))),
        @ApiResponse(responseCode = "400", description = "2FA already enabled"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/2fa/setup")
    public ResponseEntity<?> setup2FA(HttpServletRequest request){
        String token = cookieUtil.getAccessTokenFromCookies(request);
        if(token==null){
            return ResponseEntity.status(401)
                    .body(new ErrorResponse("Authentication required"));
        }
        try{
            var claims = jwt.parseClaims(token);
            var userId = UUID.fromString(claims.getSubject());
            var user = auth.findById(userId)
                    .orElseThrow(()-> new NotFoundException("User not found"));
            if(user.isTwoFactorEnabled()){
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Two-factor authentication is already enabled"));
            }
            String secret = twoFactorAuthService.generateSecret();
            String qrCodeDataUrl = twoFactorAuthService.generateQrCodeDataUrl(user, secret);
            String manualEntryKey = twoFactorAuthService.generateManualEntryKey(user, secret);
            List<String> plainBackupCodes = twoFactorAuthService.generateBackupCodes();

            user.setTwoFactorSecret(secret);
            List<String> hashedCodes = twoFactorAuthService.hashBackupCodes(plainBackupCodes);
            user.setBackupCodes(String.join(",", hashedCodes));

            auth.saveUser(user);

            return ResponseEntity.ok(new TwoFactorSetupResponse(secret, qrCodeDataUrl, manualEntryKey, plainBackupCodes));

        }catch (Exception e){
            
            return ResponseEntity.status(500)
                    .body(new ErrorResponse("Failed to setup 2FA. Please try again."));
        }
    }

    @PostMapping("/2fa/confirm")
    public ResponseEntity<?> confirm2FA(@Valid @RequestBody TwoFactorConfirmRequest req,
                                        HttpServletRequest request){

        String token = cookieUtil.getAccessTokenFromCookies(request);
        if(token == null){
            return ResponseEntity.status(401)
                    .body(new ErrorResponse("Authentication required"));
        }

        try{
            var claims = jwt.parseClaims(token);
            var userId = UUID.fromString(claims.getSubject());
            var user = auth.findById(userId)
                    .orElseThrow(()->new NotFoundException("User not found"));
            if(user.isTwoFactorEnabled()){
                return ResponseEntity.badRequest().body(new ErrorResponse("Two-factor auth is already enabled"));

            }

            if (user.getTwoFactorSecret() == null){
                return ResponseEntity.badRequest().body(new ErrorResponse("Please complete 2FA setup first"));

            }

            boolean isValid = twoFactorAuthService.verifyCode(user.getTwoFactorSecret(), req.getCode());

            if (!isValid){
                return ResponseEntity.status(401)
                        .body(new ErrorResponse("Invalid verification code"));
            }

            user.setTwoFactorEnabled(true);
            user.setTwoFactorEnabledAt(OffsetDateTime.now());;
            auth.saveUser(user);
            return ResponseEntity.ok(new MessageResponse("Two-factor auth enabled successfully"));
        }catch (JwtException e){
            return ResponseEntity.status(401)
                    .body(new ErrorResponse("Invalid authentication"));
        }
    }
    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verify2FA(@Valid @RequestBody TwoFactorVerifyRequest req,
                                       HttpServletRequest request,
                                       HttpServletResponse response){
        if (!rateLimitService.allowLogin(request)) {
            return ResponseEntity.status(429)
                    .body(new ErrorResponse("Too many verification attempts. Please try again later"));
        }
        try{
            UUID userId = twoFactorTempTokenService.validateTempToken(req.getTempToken());

            var user = auth.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            if (!user.isTwoFactorEnabled()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Two-factor authentication is not enabled"));
            }

            boolean isValid = false;

            if (req.isBackupCode()) {
                String backupCodesStr = user.getBackupCodes();

                if (backupCodesStr == null || backupCodesStr.isEmpty()) {
                    return ResponseEntity.status(401)
                            .body(new ErrorResponse("No backup codes available"));
                }
                String[] hashedCodes = backupCodesStr.split(",");
                List<String> codeList = List.of(hashedCodes);

                isValid = twoFactorAuthService.verifyBackupCode(codeList, req.getCode());

                if (isValid) {
                    String usedHash = twoFactorAuthService.findUsedBackupCodeHash(codeList, req.getCode());
                    List<String> remainingCodes = codeList.stream()
                            .filter(code -> !code.equals(usedHash))
                            .toList();
                    if (remainingCodes.isEmpty()) {
                        user.setBackupCodes(null);
                    } else {
                        user.setBackupCodes(String.join(",", remainingCodes));
                    }
                    auth.saveUser(user);
                }
            } else {
                isValid = twoFactorAuthService.verifyCode(
                        user.getTwoFactorSecret(),
                        req.getCode()
                );
            }

            if (!isValid) {
                return ResponseEntity.status(401)
                        .body(new ErrorResponse("Invalid verification code"));
            }

            String subject = user.getId().toString();
            String access = jwt.generateAccessToken(
                    subject,
                    user.getEmail(),
                    List.of(user.getRole().name())
            );
            String refresh = jwt.generateRefreshToken(subject);

            Instant expiresAt = jwt.getExpiration(access);

            cookieUtil.setAccessTokenCookie(response, access);
            cookieUtil.setRefreshTokenCookie(response, refresh);

            UserInfoDto userInfo = new UserInfoDto(
                    user.getId(),
                    user.getEmail(),
                    user.getDisplayName() != null ? user.getDisplayName() : user.getEmail(),
                    user.getRole().name()
            );

            return ResponseEntity.ok(new AuthSuccessResponse("Login successful", userInfo, expiresAt.toEpochMilli()));

        }catch (JwtException e) {
            return ResponseEntity.status(401)
                    .body(new ErrorResponse("Invalid or expired token"));
        }
    }

    @PostMapping("/2fa/disable")
    public ResponseEntity<?> disable2FA(
            @Valid @RequestBody TwoFactorDisableRequest req,
            HttpServletRequest request) {

        if (!rateLimitService.allowLogin(request)) {
            return ResponseEntity.status(429)
                    .body(new ErrorResponse("Too many disable attempts. Please try again later"));
        }

        String token = cookieUtil.getAccessTokenFromCookies(request);
        if (token == null) {
            return ResponseEntity.status(401)
                    .body(new ErrorResponse("Authentication required"));
        }

        try {
            var claims = jwt.parseClaims(token);
            var userId = UUID.fromString(claims.getSubject());
            var user = auth.findById(userId)
                    .orElseThrow(() -> new NotFoundException("User not found"));

            if (!user.isTwoFactorEnabled()) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Two-factor authentication is not enabled"));
            }

            boolean passwordOk = auth.checkCredentials(user.getEmail(), req.getPassword());
            if (!passwordOk) {
                return ResponseEntity.status(401)
                        .body(new ErrorResponse("Invalid password"));
            }

            boolean codeOk = twoFactorAuthService.verifyCode(
                    user.getTwoFactorSecret(),
                    req.getCode()
            );
            if (!codeOk) {
                return ResponseEntity.status(401)
                        .body(new ErrorResponse("Invalid verification code"));
            }

            user.setTwoFactorEnabled(false);
            user.setTwoFactorSecret(null);
            user.setBackupCodes(null);
            user.setTwoFactorEnabledAt(null);
            auth.saveUser(user);

            return ResponseEntity.ok(
                    new MessageResponse("Two-factor authentication disabled successfully")
            );

        } catch (JwtException e) {
            return ResponseEntity.status(401)
                    .body(new ErrorResponse("Invalid authentication"));
        }
    }


}
