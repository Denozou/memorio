package com.memorio.backend.contact;

import com.memorio.backend.contact.dto.ContactRequest;
import com.memorio.backend.contact.dto.ContactResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.security.SecureRandom;

/**
 * Service for handling contact form submissions.
 * Provides spam detection, input sanitization, persistence, and email notification.
 */
@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String REFERENCE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final ContactMessageRepository contactMessageRepository;
    private final SpamDetectionService spamDetectionService;
    private final JavaMailSender mailSender;

    @Value("${email.enabled:false}")
    private boolean emailEnabled;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${contact.recipient.email:${spring.mail.username}}")
    private String recipientEmail;

    @Value("${contact.email.subject-prefix:[Memorio Contact]}")
    private String subjectPrefix;

    public ContactService(
            ContactMessageRepository contactMessageRepository,
            SpamDetectionService spamDetectionService,
            JavaMailSender mailSender
    ) {
        this.contactMessageRepository = contactMessageRepository;
        this.spamDetectionService = spamDetectionService;
        this.mailSender = mailSender;
    }

    /**
     * Processes a contact form submission.
     * Performs spam detection, saves the message, and sends email notification.
     *
     * @param request   The contact request DTO
     * @param ipAddress Client IP address
     * @param userAgent Client user agent
     * @return ContactResponse with reference ID
     */
    @Transactional
    public ContactResponse submitContactForm(ContactRequest request, String ipAddress, String userAgent) {
        log.info("Processing contact form submission from IP: {}", maskIpAddress(ipAddress));

        // Sanitize inputs
        String sanitizedName = sanitizeInput(request.getName());
        String sanitizedEmail = request.getEmail().trim().toLowerCase();
        String sanitizedSubject = sanitizeInput(request.getSubject());
        String sanitizedMessage = sanitizeInput(request.getMessage());

        // Run spam detection
        SpamDetectionService.SpamDetectionResult spamResult = 
                spamDetectionService.analyze(request, ipAddress);

        // Generate unique reference ID
        String referenceId = generateReferenceId();

        // Create and save contact message
        ContactMessage contactMessage = new ContactMessage();
        contactMessage.setReferenceId(referenceId);
        contactMessage.setSenderName(sanitizedName);
        contactMessage.setSenderEmail(sanitizedEmail);
        contactMessage.setSubject(sanitizedSubject);
        contactMessage.setMessage(sanitizedMessage);
        contactMessage.setIpAddress(ipAddress);
        contactMessage.setUserAgent(truncateUserAgent(userAgent));
        contactMessage.setSpamScore(spamResult.score());
        contactMessage.setSpamReasons(spamResult.getReasonsAsString());
        contactMessage.setSpam(spamResult.isSpam());
        contactMessage.setStatus(spamResult.isSpam() 
                ? ContactMessage.ContactStatus.SPAM 
                : ContactMessage.ContactStatus.PENDING);

        contactMessageRepository.save(contactMessage);

        // Send email notification only for non-spam messages
        if (!spamResult.isSpam()) {
            boolean emailSent = sendNotificationEmail(contactMessage);
            contactMessage.setEmailSent(emailSent);
            contactMessageRepository.save(contactMessage);
        } else {
            log.info("Skipping email notification for spam message. Reference: {}, Score: {}", 
                    referenceId, spamResult.score());
        }

        log.info("Contact form processed. Reference: {}, Spam: {}, Score: {}", 
                referenceId, spamResult.isSpam(), spamResult.score());

        // Return success response (same for spam and non-spam to not reveal detection)
        return new ContactResponse(
                "Thank you for your message. We'll get back to you soon.",
                referenceId
        );
    }

    /**
     * Sends notification email to the configured recipient.
     */
    private boolean sendNotificationEmail(ContactMessage message) {
        if (!emailEnabled) {
            log.info("Email disabled. Would send contact notification for reference: {}", 
                    message.getReferenceId());
            return false;
        }

        try {
            SimpleMailMessage email = new SimpleMailMessage();
            email.setFrom(fromEmail);
            email.setTo(recipientEmail);
            email.setReplyTo(message.getSenderEmail());
            email.setSubject(subjectPrefix + " " + message.getSubject());
            email.setText(buildEmailBody(message));

            mailSender.send(email);
            log.info("Contact notification email sent. Reference: {}", message.getReferenceId());
            return true;
        } catch (Exception e) {
            log.error("Failed to send contact notification email. Reference: {}. Error: {}", 
                    message.getReferenceId(), e.getMessage());
            return false;
        }
    }

    /**
     * Builds the email body with all relevant information.
     */
    private String buildEmailBody(ContactMessage message) {
        return String.format(
                """
                New contact form submission received.
                
                Reference ID: %s
                Date: %s
                
                From: %s
                Email: %s
                
                Subject: %s
                
                Message:
                ─────────────────────────────────────
                %s
                ─────────────────────────────────────
                
                Technical Details:
                - IP Address: %s
                - User Agent: %s
                - Spam Score: %d/100
                
                ---
                This is an automated message from Memorio Contact System.
                Reply directly to this email to respond to the sender.
                """,
                message.getReferenceId(),
                message.getCreatedAt().toString(),
                message.getSenderName(),
                message.getSenderEmail(),
                message.getSubject(),
                message.getMessage(),
                message.getIpAddress(),
                message.getUserAgent() != null ? message.getUserAgent() : "Unknown",
                message.getSpamScore()
        );
    }

    /**
     * Sanitizes user input to prevent XSS and other injection attacks.
     * Escapes HTML entities and normalizes whitespace.
     */
    private String sanitizeInput(String input) {
        if (input == null) {
            return null;
        }
        // Trim and normalize whitespace
        String trimmed = input.trim().replaceAll("\\s+", " ");
        // Escape HTML entities
        return HtmlUtils.htmlEscape(trimmed);
    }

    /**
     * Generates a unique, human-readable reference ID.
     * Format: MEM-XXXXXXXX (8 alphanumeric characters, excluding ambiguous ones)
     */
    private String generateReferenceId() {
        StringBuilder sb = new StringBuilder("MEM-");
        for (int i = 0; i < 8; i++) {
            sb.append(REFERENCE_CHARS.charAt(SECURE_RANDOM.nextInt(REFERENCE_CHARS.length())));
        }
        return sb.toString();
    }

    /**
     * Truncates user agent to prevent storage issues.
     */
    private String truncateUserAgent(String userAgent) {
        if (userAgent == null) {
            return null;
        }
        return userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent;
    }

    /**
     * Masks IP address for logging (privacy protection).
     */
    private String maskIpAddress(String ip) {
        if (ip == null) {
            return "unknown";
        }
        if (ip.contains(".")) {
            // IPv4: mask last octet
            int lastDot = ip.lastIndexOf('.');
            return ip.substring(0, lastDot) + ".xxx";
        } else if (ip.contains(":")) {
            // IPv6: mask last half
            return ip.substring(0, Math.min(ip.length(), 10)) + ":xxxx";
        }
        return "xxx";
    }
}
