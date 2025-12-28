package com.memorio.backend.contact;

import com.memorio.backend.contact.dto.ContactRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Service for detecting spam in contact form submissions.
 * Uses multiple heuristics to calculate a spam score.
 */
@Service
public class SpamDetectionService {

    private static final Logger log = LoggerFactory.getLogger(SpamDetectionService.class);

    private final ContactMessageRepository contactMessageRepository;

    // Spam detection thresholds
    private static final int SPAM_THRESHOLD = 75;
    private static final int MIN_FORM_FILL_TIME_MS = 2000; // 2 seconds
    private static final int MAX_MESSAGES_PER_EMAIL_PER_HOUR = 3;
    private static final int MAX_MESSAGES_PER_IP_PER_HOUR = 5;
    private static final int MAX_SPAM_PER_IP_PER_DAY = 3;

    // Patterns for spam detection
    private static final Pattern URL_PATTERN = Pattern.compile(
            "(https?://|www\\.)[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern EXCESSIVE_CAPS_PATTERN = Pattern.compile("[A-Z]{10,}");
    private static final Pattern REPEATED_CHARS_PATTERN = Pattern.compile("(.)\\1{4,}");
    private static final Pattern COMMON_SPAM_WORDS = Pattern.compile(
            "\\b(viagra|cialis|casino|lottery|winner|congratulations|bitcoin|crypto|investment|guaranteed|" +
            "free money|click here|act now|limited time|urgent|million dollars|nigerian prince)\\b",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern SCRIPT_INJECTION_PATTERN = Pattern.compile(
            "<script|javascript:|onclick|onerror|onload|eval\\(|document\\.|window\\.",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            "(union\\s+select|drop\\s+table|insert\\s+into|delete\\s+from|update\\s+.*\\s+set|--|;\\s*$)",
            Pattern.CASE_INSENSITIVE
    );

    public SpamDetectionService(ContactMessageRepository contactMessageRepository) {
        this.contactMessageRepository = contactMessageRepository;
    }

    /**
     * Analyzes a contact request and returns a spam detection result.
     * NOTE: Spam filtering is currently DISABLED - all messages pass through.
     * To re-enable, set SPAM_FILTERING_ENABLED to true.
     */
    private static final boolean SPAM_FILTERING_ENABLED = true;

    public SpamDetectionResult analyze(ContactRequest request, String ipAddress) {
        // Spam filtering disabled - return not spam immediately
        if (!SPAM_FILTERING_ENABLED) {
            log.debug("Spam filtering disabled - allowing message from IP {}", ipAddress);
            return new SpamDetectionResult(false, 0, List.of());
        }

        List<String> reasons = new ArrayList<>();
        int score = 0;

        // 1. Honeypot check (critical - instant spam)
        if (request.getCompanyFax() != null && !request.getCompanyFax().isBlank()) {
            reasons.add("Honeypot field filled");
            score += 100; // Definite spam
        }

        // 2. Form timing check
        if (request.getFormLoadedAt() != null) {
            long fillTime = System.currentTimeMillis() - request.getFormLoadedAt();
            if (fillTime < MIN_FORM_FILL_TIME_MS) {
                reasons.add("Form submitted too quickly (" + fillTime + "ms)");
                score += 25;
            }
        } else {
            // Missing timestamp is slightly suspicious but not definitive
            score += 5;
        }

        // 3. Rate limiting checks
        OffsetDateTime oneHourAgo = OffsetDateTime.now().minusHours(1);
        OffsetDateTime oneDayAgo = OffsetDateTime.now().minusDays(1);

        long emailCount = contactMessageRepository.countBySenderEmailSince(request.getEmail(), oneHourAgo);
        if (emailCount >= MAX_MESSAGES_PER_EMAIL_PER_HOUR) {
            reasons.add("Too many messages from this email (" + emailCount + " in last hour)");
            score += 20;
        }

        long ipCount = contactMessageRepository.countByIpAddressSince(ipAddress, oneHourAgo);
        if (ipCount >= MAX_MESSAGES_PER_IP_PER_HOUR) {
            reasons.add("Too many messages from this IP (" + ipCount + " in last hour)");
            score += 15;
        }

        long spamCount = contactMessageRepository.countSpamByIpAddressSince(ipAddress, oneDayAgo);
        if (spamCount >= MAX_SPAM_PER_IP_PER_DAY) {
            reasons.add("IP has sent spam recently (" + spamCount + " spam messages)");
            score += 50;
        }

        // 4. Duplicate message check
        if (contactMessageRepository.existsDuplicateMessage(request.getEmail(), request.getMessage(), oneHourAgo)) {
            reasons.add("Duplicate message detected");
            score += 30;
        }

        // 5. Content analysis
        String message = request.getMessage();
        String subject = request.getSubject();
        String combinedContent = subject + " " + message;

        // URL spam
        long urlCount = URL_PATTERN.matcher(combinedContent).results().count();
        if (urlCount > 2) {
            reasons.add("Too many URLs (" + urlCount + ")");
            score += Math.min((int) (urlCount * 10), 30);
        }

        // Excessive caps (only if very excessive)
        if (EXCESSIVE_CAPS_PATTERN.matcher(combinedContent).find()) {
            reasons.add("Excessive capitalization");
            score += 10;
        }

        // Repeated characters
        if (REPEATED_CHARS_PATTERN.matcher(combinedContent).find()) {
            reasons.add("Repeated characters detected");
            score += 5;
        }

        // Common spam words
        long spamWordCount = COMMON_SPAM_WORDS.matcher(combinedContent).results().count();
        if (spamWordCount > 0) {
            reasons.add("Contains spam keywords (" + spamWordCount + ")");
            score += Math.min((int) (spamWordCount * 15), 45);
        }

        // 6. Security checks (XSS, SQL injection)
        if (SCRIPT_INJECTION_PATTERN.matcher(combinedContent).find()) {
            reasons.add("Potential XSS attempt detected");
            score += 60;
        }

        if (SQL_INJECTION_PATTERN.matcher(combinedContent).find()) {
            reasons.add("Potential SQL injection attempt detected");
            score += 60;
        }

        // 7. Email/name mismatch heuristic (very weak signal, just for context)
        // Removed: too many false positives with legitimate emails like john1985@example.com

        boolean isSpam = score >= SPAM_THRESHOLD;

        if (isSpam) {
            log.warn("Spam detected from IP {} with score {}: {}", ipAddress, score, reasons);
        }

        return new SpamDetectionResult(isSpam, score, reasons);
    }

    /**
     * Result of spam detection analysis.
     */
    public record SpamDetectionResult(
            boolean isSpam,
            int score,
            List<String> reasons
    ) {
        public String getReasonsAsString() {
            return String.join("; ", reasons);
        }
    }
}
