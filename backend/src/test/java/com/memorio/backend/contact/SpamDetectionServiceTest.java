package com.memorio.backend.contact;

import com.memorio.backend.contact.dto.ContactRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SpamDetectionService Unit Tests")
class SpamDetectionServiceTest {

    @Mock
    private ContactMessageRepository contactMessageRepository;

    @InjectMocks
    private SpamDetectionService spamDetectionService;

    private ContactRequest validRequest;
    private static final String TEST_IP = "192.168.1.100";

    @BeforeEach
    void setUp() {
        validRequest = new ContactRequest();
        validRequest.setName("John Doe");
        validRequest.setEmail("john@example.com");
        validRequest.setSubject("Test Subject");
        validRequest.setMessage("This is a normal, legitimate test message for the contact form submission.");
        validRequest.setFormLoadedAt(System.currentTimeMillis() - 10000); // 10 seconds ago
    }

    @Nested
    @DisplayName("Honeypot Detection tests")
    class HoneypotDetectionTests {

        @Test
        @DisplayName("Should detect spam when honeypot field is filled")
        void shouldDetectSpamWhenHoneypotFilled() {
            validRequest.setCompanyFax("filled-by-bot");

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.isSpam());
            assertEquals(100, result.score());
            assertTrue(result.reasons().contains("Honeypot field filled"));
        }

        @Test
        @DisplayName("Should not flag honeypot when empty")
        void shouldNotFlagHoneypotWhenEmpty() {
            validRequest.setCompanyFax(null);

            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertFalse(result.reasons().contains("Honeypot field filled"));
        }

        @Test
        @DisplayName("Should not flag honeypot when blank")
        void shouldNotFlagHoneypotWhenBlank() {
            validRequest.setCompanyFax("   ");

            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertFalse(result.reasons().contains("Honeypot field filled"));
        }
    }

    @Nested
    @DisplayName("Form Timing tests")
    class FormTimingTests {

        @Test
        @DisplayName("Should detect spam when form submitted too quickly")
        void shouldDetectSpamWhenFormTooQuick() {
            validRequest.setFormLoadedAt(System.currentTimeMillis() - 500); // 0.5 seconds ago

            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.score() >= 25);
            assertTrue(result.reasons().stream().anyMatch(r -> r.contains("too quickly")));
        }

        @Test
        @DisplayName("Should add small penalty when timestamp missing")
        void shouldAddPenaltyWhenTimestampMissing() {
            validRequest.setFormLoadedAt(null);

            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.score() >= 5);
        }
    }

    @Nested
    @DisplayName("Rate Limiting tests")
    class RateLimitingTests {

        @Test
        @DisplayName("Should detect spam when too many messages from email")
        void shouldDetectSpamWhenTooManyFromEmail() {
            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(3L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.score() >= 20);
            assertTrue(result.reasons().stream().anyMatch(r -> r.contains("Too many messages from this email")));
        }

        @Test
        @DisplayName("Should detect spam when too many messages from IP")
        void shouldDetectSpamWhenTooManyFromIp() {
            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(5L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.score() >= 15);
            assertTrue(result.reasons().stream().anyMatch(r -> r.contains("Too many messages from this IP")));
        }

        @Test
        @DisplayName("Should detect spam when IP has spam history")
        void shouldDetectSpamWhenIpHasSpamHistory() {
            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(3L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.score() >= 50);
            assertTrue(result.reasons().stream().anyMatch(r -> r.contains("IP has sent spam recently")));
        }
    }

    @Nested
    @DisplayName("Duplicate Detection tests")
    class DuplicateDetectionTests {

        @Test
        @DisplayName("Should detect duplicate message")
        void shouldDetectDuplicateMessage() {
            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(true);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.score() >= 30);
            assertTrue(result.reasons().contains("Duplicate message detected"));
        }
    }

    @Nested
    @DisplayName("Content Analysis tests")
    class ContentAnalysisTests {

        @Test
        @DisplayName("Should detect too many URLs")
        void shouldDetectTooManyUrls() {
            validRequest.setMessage("Check out http://spam1.com and http://spam2.com and http://spam3.com for more");

            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.reasons().stream().anyMatch(r -> r.contains("Too many URLs")));
        }

        @Test
        @DisplayName("Should detect excessive capitalization")
        void shouldDetectExcessiveCaps() {
            validRequest.setMessage("LOOK AT THIS AMAZING OPPORTUNITY FOR FREE MONEY NOW");

            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.reasons().stream().anyMatch(r -> r.contains("Excessive capitalization")));
        }

        @Test
        @DisplayName("Should detect spam keywords")
        void shouldDetectSpamKeywords() {
            // Message contains multiple spam words: congratulations, lottery, winner, million dollars
            validRequest.setMessage("Congratulations winner! You've won the lottery! Claim your guaranteed million dollars now!");

            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            // Should detect spam keywords and add points
            assertTrue(result.reasons().stream().anyMatch(r -> r.contains("spam keywords")));
            assertTrue(result.score() >= 45); // Multiple spam words add up to max 45
        }
    }

    @Nested
    @DisplayName("Security Detection tests")
    class SecurityDetectionTests {

        @Test
        @DisplayName("Should detect potential XSS attempt")
        void shouldDetectXssAttempt() {
            validRequest.setMessage("Normal message with <script>alert('xss')</script> embedded");

            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.score() >= 60);
            assertTrue(result.reasons().stream().anyMatch(r -> r.contains("XSS")));
        }

        @Test
        @DisplayName("Should detect potential SQL injection")
        void shouldDetectSqlInjection() {
            validRequest.setMessage("Normal message; DROP TABLE users;--");

            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertTrue(result.score() >= 60);
            assertTrue(result.reasons().stream().anyMatch(r -> r.contains("SQL injection")));
        }
    }

    @Nested
    @DisplayName("Clean Message tests")
    class CleanMessageTests {

        @Test
        @DisplayName("Should allow legitimate message through")
        void shouldAllowLegitimateMessage() {
            when(contactMessageRepository.countBySenderEmailSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.countSpamByIpAddressSince(anyString(), any(OffsetDateTime.class))).thenReturn(0L);
            when(contactMessageRepository.existsDuplicateMessage(anyString(), anyString(), any(OffsetDateTime.class))).thenReturn(false);

            SpamDetectionService.SpamDetectionResult result = spamDetectionService.analyze(validRequest, TEST_IP);

            assertFalse(result.isSpam());
            assertTrue(result.score() < 75);
        }
    }

    @Nested
    @DisplayName("SpamDetectionResult tests")
    class SpamDetectionResultTests {

        @Test
        @DisplayName("Should format reasons as string")
        void shouldFormatReasonsAsString() {
            SpamDetectionService.SpamDetectionResult result =
                    new SpamDetectionService.SpamDetectionResult(true, 100,
                            java.util.List.of("Reason 1", "Reason 2", "Reason 3"));

            assertEquals("Reason 1; Reason 2; Reason 3", result.getReasonsAsString());
        }

        @Test
        @DisplayName("Should handle empty reasons")
        void shouldHandleEmptyReasons() {
            SpamDetectionService.SpamDetectionResult result =
                    new SpamDetectionService.SpamDetectionResult(false, 0, java.util.List.of());

            assertEquals("", result.getReasonsAsString());
        }
    }
}
