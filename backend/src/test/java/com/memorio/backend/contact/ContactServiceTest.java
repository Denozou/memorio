package com.memorio.backend.contact;

import com.memorio.backend.contact.dto.ContactRequest;
import com.memorio.backend.contact.dto.ContactResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ContactService Unit Tests")
class ContactServiceTest {

    @Mock
    private ContactMessageRepository contactMessageRepository;

    @Mock
    private SpamDetectionService spamDetectionService;

    @Mock
    private JavaMailSender mailSender;

    @InjectMocks
    private ContactService contactService;

    private ContactRequest validRequest;
    private static final String TEST_IP = "192.168.1.100";
    private static final String TEST_USER_AGENT = "Mozilla/5.0 Test Browser";

    @BeforeEach
    void setUp() {
        validRequest = new ContactRequest();
        validRequest.setName("John Doe");
        validRequest.setEmail("john@example.com");
        validRequest.setSubject("Test Subject");
        validRequest.setMessage("This is a test message for the contact form.");
        validRequest.setFormLoadedAt(System.currentTimeMillis() - 10000);
    }

    @Nested
    @DisplayName("submitContactForm tests")
    class SubmitContactFormTests {

        @Test
        @DisplayName("Should process valid contact form submission successfully")
        void shouldProcessValidSubmission() {
            SpamDetectionService.SpamDetectionResult notSpamResult =
                    new SpamDetectionService.SpamDetectionResult(false, 0, List.of());

            when(spamDetectionService.analyze(eq(validRequest), eq(TEST_IP))).thenReturn(notSpamResult);
            when(contactMessageRepository.save(any(ContactMessage.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ContactResponse response = contactService.submitContactForm(validRequest, TEST_IP, TEST_USER_AGENT);

            assertNotNull(response);
            assertNotNull(response.getReferenceId());
            assertTrue(response.getReferenceId().startsWith("MEM-"));
            assertEquals(12, response.getReferenceId().length()); // MEM- + 8 chars
            assertNotNull(response.getMessage());

            verify(contactMessageRepository, times(2)).save(any(ContactMessage.class));
        }

        @Test
        @DisplayName("Should detect and handle spam submission")
        void shouldHandleSpamSubmission() {
            SpamDetectionService.SpamDetectionResult spamResult =
                    new SpamDetectionService.SpamDetectionResult(true, 100, List.of("Honeypot field filled"));

            when(spamDetectionService.analyze(eq(validRequest), eq(TEST_IP))).thenReturn(spamResult);
            when(contactMessageRepository.save(any(ContactMessage.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ContactResponse response = contactService.submitContactForm(validRequest, TEST_IP, TEST_USER_AGENT);

            // Response should be same as non-spam (to not reveal detection)
            assertNotNull(response);
            assertNotNull(response.getReferenceId());

            // Verify spam message is saved with spam status
            verify(contactMessageRepository).save(argThat(msg ->
                    msg.isSpam() &&
                    msg.getStatus() == ContactMessage.ContactStatus.SPAM &&
                    msg.getSpamScore() == 100
            ));

            // Should only save once (no email notification attempt for spam)
            verify(contactMessageRepository, times(1)).save(any(ContactMessage.class));
        }

        @Test
        @DisplayName("Should sanitize input to prevent XSS")
        void shouldSanitizeInput() {
            ContactRequest xssRequest = new ContactRequest();
            xssRequest.setName("<script>alert('xss')</script>John");
            xssRequest.setEmail("john@example.com");
            xssRequest.setSubject("Test <b>Subject</b>");
            xssRequest.setMessage("Normal message content with safe text.");
            xssRequest.setFormLoadedAt(System.currentTimeMillis() - 10000);

            SpamDetectionService.SpamDetectionResult notSpamResult =
                    new SpamDetectionService.SpamDetectionResult(false, 0, List.of());

            when(spamDetectionService.analyze(any(), any())).thenReturn(notSpamResult);
            when(contactMessageRepository.save(any(ContactMessage.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            contactService.submitContactForm(xssRequest, TEST_IP, TEST_USER_AGENT);

            verify(contactMessageRepository, atLeastOnce()).save(argThat(msg ->
                    msg.getSenderName().contains("&lt;script&gt;") &&
                    msg.getSubject().contains("&lt;b&gt;")
            ));
        }

        @Test
        @DisplayName("Should truncate long user agent")
        void shouldTruncateLongUserAgent() {
            String longUserAgent = "X".repeat(600);
            SpamDetectionService.SpamDetectionResult notSpamResult =
                    new SpamDetectionService.SpamDetectionResult(false, 0, List.of());

            when(spamDetectionService.analyze(any(), any())).thenReturn(notSpamResult);
            when(contactMessageRepository.save(any(ContactMessage.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            contactService.submitContactForm(validRequest, TEST_IP, longUserAgent);

            verify(contactMessageRepository, atLeastOnce()).save(argThat(msg ->
                    msg.getUserAgent() != null && msg.getUserAgent().length() == 500
            ));
        }

        @Test
        @DisplayName("Should handle null user agent")
        void shouldHandleNullUserAgent() {
            SpamDetectionService.SpamDetectionResult notSpamResult =
                    new SpamDetectionService.SpamDetectionResult(false, 0, List.of());

            when(spamDetectionService.analyze(any(), any())).thenReturn(notSpamResult);
            when(contactMessageRepository.save(any(ContactMessage.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ContactResponse response = contactService.submitContactForm(validRequest, TEST_IP, null);

            assertNotNull(response);
            verify(contactMessageRepository, atLeastOnce()).save(argThat(msg -> msg.getUserAgent() == null));
        }

        @Test
        @DisplayName("Should normalize email to lowercase")
        void shouldNormalizeEmailToLowercase() {
            validRequest.setEmail("  JOHN@EXAMPLE.COM  ");
            SpamDetectionService.SpamDetectionResult notSpamResult =
                    new SpamDetectionService.SpamDetectionResult(false, 0, List.of());

            when(spamDetectionService.analyze(any(), any())).thenReturn(notSpamResult);
            when(contactMessageRepository.save(any(ContactMessage.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            contactService.submitContactForm(validRequest, TEST_IP, TEST_USER_AGENT);

            verify(contactMessageRepository, atLeastOnce()).save(argThat(msg ->
                    msg.getSenderEmail().equals("john@example.com")
            ));
        }

        @Test
        @DisplayName("Should generate unique reference IDs")
        void shouldGenerateUniqueReferenceIds() {
            SpamDetectionService.SpamDetectionResult notSpamResult =
                    new SpamDetectionService.SpamDetectionResult(false, 0, List.of());

            when(spamDetectionService.analyze(any(), any())).thenReturn(notSpamResult);
            when(contactMessageRepository.save(any(ContactMessage.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            ContactResponse response1 = contactService.submitContactForm(validRequest, TEST_IP, TEST_USER_AGENT);
            ContactResponse response2 = contactService.submitContactForm(validRequest, TEST_IP, TEST_USER_AGENT);

            assertNotEquals(response1.getReferenceId(), response2.getReferenceId());
        }
    }
}
