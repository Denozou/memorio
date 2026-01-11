package com.memorio.backend.auth;

import com.memorio.backend.common.email.EmailService;
import com.memorio.backend.common.security.ClientIpResolver;
import com.memorio.backend.user.User;
import com.memorio.backend.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.redis.core.RedisTemplate;
import java.util.concurrent.TimeUnit;


@Service
public class VerificationService {

    private static final Logger log = LoggerFactory.getLogger(VerificationService.class);
    private static final int EMAIL_VERIFICATION_HOURS = 24;
    private static final int PASSWORD_RESET_HOURS = 1;
    private static final int TOKEN_LENGTH = 32;
    private static final int PASSWORD_RESET_RATE_LIMIT_SECONDS = 60; // 1 minute between requests
    private static final String RESET_RATE_LIMIT_PREFIX = "password-reset-rate:";

    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final AuthService authService;
    private final SecureRandom secureRandom;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ClientIpResolver clientIpResolver;

    public VerificationService(
            VerificationTokenRepository tokenRepository,
            UserRepository userRepository,
            EmailService emailService,
            AuthService authService,
            RedisTemplate<String, Object> redisTemplate,
            ClientIpResolver clientIpResolver) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.authService = authService;
        this.secureRandom = new SecureRandom();
        this.redisTemplate = redisTemplate;
        this.clientIpResolver = clientIpResolver;
    }

    @Transactional
    public void createAndSendEmailVerification(User user){
        createAndSendEmailVerification(user, null);
    }

    @Transactional
    public void createAndSendEmailVerification(User user, String requestIp){
        // Delete any existing email verification tokens for this user
        tokenRepository.deleteByUserIdAndTokenType(user.getId(), TokenType.EMAIL_VERIFICATION);

        String token = generateSecureToken();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(EMAIL_VERIFICATION_HOURS);

        VerificationToken verificationToken = new VerificationToken(
                user, token, TokenType.EMAIL_VERIFICATION, expiresAt, requestIp
        );
        tokenRepository.save(verificationToken);
        
        try {
            emailService.sendVerificationEmail(user.getEmail(), token);
            log.info("Email verification token created and sent for user: {} from IP: {}", user.getEmail(), requestIp);
        } catch (Exception e) {
            log.error("Failed to send verification email to: {} from IP: {}. Error: {}", 
                    user.getEmail(), requestIp, e.getMessage());
        }
    }

    @Transactional
    public void createAndSendPasswordReset(String email){
        createAndSendPasswordReset(email, null);
    }

    @Transactional
    public void createAndSendPasswordReset(String email, String requestIp){
        Optional<User> userOpt = userRepository.findByEmail(email);

        if(userOpt.isEmpty()){
            log.info("Password reset requested for non-existent email: {} from IP: {}", email, requestIp);
            return;
        }

        User user = userOpt.get();

        // Rate limiting: prevent brute-force flooding using Redis
        // Redis ensures rate limiting works across all backend instances
        OffsetDateTime now = OffsetDateTime.now();
        UUID userId = user.getId();
        String rateLimitKey = RESET_RATE_LIMIT_PREFIX + userId;

        // Check if rate limit exists in Redis
        Object lastRequestObj = redisTemplate.opsForValue().get(rateLimitKey);

        if (lastRequestObj != null) {
            OffsetDateTime lastRequest = (OffsetDateTime) lastRequestObj;
            if (lastRequest.plusSeconds(PASSWORD_RESET_RATE_LIMIT_SECONDS).isAfter(now)) {
                log.warn("Password reset rate limit exceeded for user: {} from IP: {}", 
                    user.getEmail(), requestIp);
                return;
            }
        }

        // Set rate limit in Redis with automatic expiration (TTL)
        // TTL = rate limit duration + 1 minute buffer
        redisTemplate.opsForValue().set(
            rateLimitKey, 
            now, 
            PASSWORD_RESET_RATE_LIMIT_SECONDS + 60, 
            TimeUnit.SECONDS
        );

        // Delete any existing password reset tokens for this user
        tokenRepository.deleteByUserIdAndTokenType(user.getId(), TokenType.PASSWORD_RESET);

        String token = generateSecureToken();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(PASSWORD_RESET_HOURS);

        VerificationToken verificationToken = new VerificationToken(
                user, token, TokenType.PASSWORD_RESET, expiresAt, requestIp
        );
        tokenRepository.save(verificationToken);

        // Handle email sending exceptions gracefully
        try {
            emailService.sendPasswordResetEmail(user.getEmail(), token);
            log.info("Password reset token created and sent for user: {} from IP: {}", user.getEmail(), requestIp);
        } catch (Exception e) {
            log.error("Failed to send password reset email to: {} from IP: {}. Error: {}", 
                    user.getEmail(), requestIp, e.getMessage());
            // Token is still created, but email failed
        }

    }
    /**
     * Verifies an email using the provided token.
     * Returns false for ANY validation failure to prevent timing attacks and information leakage.
     * Never reveals WHY validation failed (invalid token, wrong type, expired, used, etc.)
     */
    @Transactional
    public boolean verifyEmail(String token){
        // Use the secure finder method to get only valid (unused and not expired) tokens
        Optional<VerificationToken> tokenOpt = tokenRepository
                .findByTokenAndUsedAtIsNullAndExpiresAtAfter(token, OffsetDateTime.now());
        
        if(tokenOpt.isEmpty()){
            // Log internally but return generic false to prevent information leakage
            log.warn("Email verification failed: invalid, expired, or used token");
            return false;
        }

        VerificationToken verificationToken = tokenOpt.get();

        // Check token type - return false without revealing the reason
        if(verificationToken.getTokenType() != TokenType.EMAIL_VERIFICATION){
            log.warn("Email verification failed: wrong token type");
            return false;
        }
        
        // Mark token as used
        verificationToken.markAsUsed();
        tokenRepository.save(verificationToken);

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        
        // Invalidate ALL other email verification tokens for this user (security best practice)
        tokenRepository.deleteByUserIdAndTokenType(user.getId(), TokenType.EMAIL_VERIFICATION);
        
        log.info("Email verified successfully for user: {}", user.getEmail());
        return true;
    }

    @Transactional(readOnly = true)
    public Optional<User> validatePasswordResetToken(String token){
        // Use the new finder method to get only valid (unused and not expired) tokens
        Optional<VerificationToken> tokenOpt = tokenRepository
                .findByTokenAndUsedAtIsNullAndExpiresAtAfter(token, OffsetDateTime.now());
        
        if (tokenOpt.isEmpty()) {
            return Optional.empty();
        }
        
        VerificationToken verificationToken = tokenOpt.get();
        if (verificationToken.getTokenType() != TokenType.PASSWORD_RESET) {
            return Optional.empty();
        }

        return Optional.of(verificationToken.getUser());
    }
    /**
     * Atomically resets a user's password using a valid reset token.
     * This method ensures that both the password update and token marking
     * occur within a single transaction, preventing partial failures.
     * 
     * @param token The password reset token
     * @param newPassword The new password to set
     * @throws IllegalArgumentException if token is invalid or expired
     */
    @Transactional
    public void resetPasswordWithToken(String token, String newPassword) {
        // Validate token and get user
        Optional<User> userOpt = validatePasswordResetToken(token);
        
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid or expired reset token");
        }
        
        User user = userOpt.get();
        
        // Update password (this will throw if validation fails)
        authService.updatePassword(user, newPassword);
        
        // Mark token as used (only if password update succeeded)
        markPasswordResetTokenAsUsed(token);
        
        log.info("Password reset successfully for user: {}", user.getEmail());
    }
    
    @Transactional
    public void markPasswordResetTokenAsUsed(String token) {
        // Use secure finder to only mark valid tokens as used
        tokenRepository.findByTokenAndUsedAtIsNullAndExpiresAtAfter(token, OffsetDateTime.now())
                .ifPresent(verificationToken -> {
                    verificationToken.markAsUsed();
                    tokenRepository.save(verificationToken);
                    
                    // Invalidate ALL other password reset tokens for this user
                    tokenRepository.deleteByUserIdAndTokenType(
                            verificationToken.getUser().getId(), 
                            TokenType.PASSWORD_RESET
                    );
                });
    }

    private String generateSecureToken(){
        byte[] randomBytes = new byte[TOKEN_LENGTH];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Scheduled job that runs daily at 2 AM to clean up expired tokens.
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredTokens(){
        tokenRepository.deleteExpiredTokens(OffsetDateTime.now());
        log.info("Expired verification tokens cleaned up");
    }

    /**
     * Scheduled job that runs daily at 3 AM to clean up used tokens.
     * Prevents database bloat from accumulating used tokens.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupUsedTokens(){
        tokenRepository.deleteUsedTokens();
        log.info("Used verification tokens cleaned up");
    }
    // NOTE: Manual cleanup no longer needed!
    // Redis automatically deletes expired entries using TTL (Time-To-Live)
    // The old @Scheduled cleanup method has been removed

    /**
     * Initiates an email change request by sending a verification email to the new address.
     * The email will only be changed after the user confirms via the link sent to the new email.
     *
     * @param user The user requesting the email change
     * @param newEmail The new email address to change to
     * @param requestIp The IP address of the request
     * @return true if the verification email was sent, false if the email is already in use
     */
    @Transactional
    public boolean initiateEmailChange(User user, String newEmail, String requestIp) {
        // Check if new email is already in use by another user
        if (userRepository.existsByEmailIgnoreCase(newEmail)) {
            log.warn("Email change failed: email {} already in use. Requested by user: {}",
                    newEmail, user.getEmail());
            return false;
        }

        // Delete any existing email change tokens for this user
        tokenRepository.deleteByUserIdAndTokenType(user.getId(), TokenType.EMAIL_CHANGE);

        String token = generateSecureToken();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(EMAIL_VERIFICATION_HOURS);

        VerificationToken verificationToken = new VerificationToken(
                user, token, TokenType.EMAIL_CHANGE, expiresAt, requestIp
        );
        verificationToken.setNewEmail(newEmail);
        tokenRepository.save(verificationToken);

        try {
            emailService.sendEmailChangeVerification(newEmail, token);
            log.info("Email change verification sent to {} for user: {} from IP: {}",
                    newEmail, user.getEmail(), requestIp);
            return true;
        } catch (Exception e) {
            log.error("Failed to send email change verification to: {} for user: {}. Error: {}",
                    newEmail, user.getEmail(), e.getMessage());
            return true; // Still return true - token is created, email just failed to send
        }
    }

    /**
     * Confirms an email change using the provided token.
     * Updates the user's email address to the new email stored in the token.
     *
     * @param token The email change verification token
     * @return true if the email was successfully changed, false otherwise
     */
    @Transactional
    public boolean confirmEmailChange(String token) {
        Optional<VerificationToken> tokenOpt = tokenRepository
                .findByTokenAndUsedAtIsNullAndExpiresAtAfter(token, OffsetDateTime.now());

        if (tokenOpt.isEmpty()) {
            log.warn("Email change confirmation failed: invalid, expired, or used token");
            return false;
        }

        VerificationToken verificationToken = tokenOpt.get();

        if (verificationToken.getTokenType() != TokenType.EMAIL_CHANGE) {
            log.warn("Email change confirmation failed: wrong token type");
            return false;
        }

        String newEmail = verificationToken.getNewEmail();
        if (newEmail == null || newEmail.isBlank()) {
            log.warn("Email change confirmation failed: no new email in token");
            return false;
        }

        // Double-check the email is still available (could have been taken since token was created)
        if (userRepository.existsByEmailIgnoreCase(newEmail)) {
            log.warn("Email change confirmation failed: email {} is now in use", newEmail);
            return false;
        }

        // Mark token as used
        verificationToken.markAsUsed();
        tokenRepository.save(verificationToken);

        // Update the user's email
        User user = verificationToken.getUser();
        String oldEmail = user.getEmail();
        user.setEmail(newEmail);
        user.setEmailVerified(true); // The new email is now verified
        userRepository.save(user);

        // Invalidate ALL other email change tokens for this user
        tokenRepository.deleteByUserIdAndTokenType(user.getId(), TokenType.EMAIL_CHANGE);

        log.info("Email changed successfully from {} to {} for user: {}",
                oldEmail, newEmail, user.getId());
        return true;
    }

    /**
     * Securely extracts the real client IP address from the request.
     *
     * <p>Delegates to {@link ClientIpResolver} which validates that forwarded
     * headers only come from trusted proxies, preventing IP spoofing attacks.</p>
     *
     * @param request The HTTP servlet request
     * @return The validated client IP address
     */
    public String getClientIp(HttpServletRequest request) {
        return clientIpResolver.resolveClientIp(request);
    }
}
