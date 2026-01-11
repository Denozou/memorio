package com.memorio.backend.common.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final String fromEmail;
    private final String frontendUrl;
    private final boolean emailEnabled;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username}") String fromEmail,
            @Value("${frontend.url}") String frontendUrl,
            @Value("${email.enabled:false}") boolean emailEnabled
    ){
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
        this.frontendUrl = frontendUrl;
        this.emailEnabled = emailEnabled;
        log.info("EmailService initialized - emailEnabled: {}, frontendUrl: {}", emailEnabled, frontendUrl);
    }

    public void sendVerificationEmail(String toEmail, String token){
        // Build URL safely with proper encoding
        String verificationLink = UriComponentsBuilder
                .fromHttpUrl(frontendUrl)
                .path("/auth/verify-email")
                .queryParam("token", token)
                .toUriString();

        if(!emailEnabled){
            log.info("Email disabled. Verification link would be: {}", verificationLink);
            return;
        }

        String subject = "Verify your email - Memorio";
        // TODO: Consider moving to external template file (e.g., resources/email/verification.txt)
        String body = String.format(
                "Hello,\n\n" +
                        "Thank you for registering with Memorio!\n\n" +
                        "Please click the link below to verify your email address:\n" +
                        "%s\n\n" +
                        "This link will expire in 24 hours.\n\n" +
                        "If you didn't create an account with Memorio, please ignore this email.\n\n" +
                        "Best regards,\n" +
                        "The Memorio Team",
                verificationLink
        );
        sendEmail(toEmail, subject, body);
    }

    public void sendPasswordResetEmail(String toEmail, String token){
        // Build URL safely with proper encoding
        String resetLink = UriComponentsBuilder
                .fromHttpUrl(frontendUrl)
                .path("/auth/reset-password")
                .queryParam("token", token)
                .toUriString();

        if (!emailEnabled) {
            log.info("Email disabled. Password reset link would be: {}", resetLink);
            return;
        }

        String subject = "Password Reset Request - Memorio";
        // TODO: Consider moving to external template file (e.g., resources/email/password-reset.txt)
        String body = String.format(
                "Hello,\n\n" +
                        "We received a request to reset your password for your Memorio account.\n\n" +
                        "Please click the link below to reset your password:\n" +
                        "%s\n\n" +
                        "This link will expire in 1 hour.\n\n" +
                        "If you didn't request a password reset, please ignore this email. " +
                        "Your password will remain unchanged.\n\n" +
                        "Best regards,\n" +
                        "The Memorio Team",
                resetLink
        );

        sendEmail(toEmail, subject, body);
    }

    public void sendEmailChangeVerification(String newEmail, String token) {
        // Build URL safely with proper encoding
        String confirmLink = UriComponentsBuilder
                .fromHttpUrl(frontendUrl)
                .path("/auth/confirm-email-change")
                .queryParam("token", token)
                .toUriString();

        if (!emailEnabled) {
            log.info("Email disabled. Email change confirmation link would be: {}", confirmLink);
            return;
        }

        String subject = "Confirm Your New Email Address - Memorio";
        String body = String.format(
                "Hello,\n\n" +
                        "You requested to change your email address on Memorio to this address.\n\n" +
                        "Please click the link below to confirm this email change:\n" +
                        "%s\n\n" +
                        "This link will expire in 24 hours.\n\n" +
                        "If you didn't request this change, please ignore this email. " +
                        "Your email address will remain unchanged.\n\n" +
                        "Best regards,\n" +
                        "The Memorio Team",
                confirmLink
        );

        sendEmail(newEmail, subject, body);
    }

    /**
     * Sends an email. Email failures are logged but do NOT break the user flow.
     * This is intentional - email sending should be non-blocking.
     * 
     * TODO: Consider switching to HTML emails using MimeMessageHelper for prettier formatting
     * TODO: Consider using a templating engine (Thymeleaf/Freemarker) for complex templates
     */
    private void sendEmail(String to, String subject, String body){
        try{
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        }catch (Exception e){
            // Log error but do NOT throw exception - email failures should not break user flow
            log.error("Failed to send email to: {}. Subject: '{}'. Error: {}", 
                    to, subject, e.getMessage(), e);
            // Consider: Add metrics/alerting here for production monitoring
        }
    }
}
