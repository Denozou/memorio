package com.memorio.backend.contact;

import com.memorio.backend.common.security.ClientIpResolver;
import com.memorio.backend.contact.dto.ContactRequest;
import com.memorio.backend.contact.dto.ContactResponse;
import com.memorio.backend.common.error.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for contact form submissions.
 * Provides a public endpoint for users to send messages.
 * Includes rate limiting and security measures.
 */
@RestController
@RequestMapping("/api/contact")
public class ContactController {

    private static final Logger log = LoggerFactory.getLogger(ContactController.class);

    private final ContactService contactService;
    private final ContactRateLimitService rateLimitService;
    private final ClientIpResolver clientIpResolver;

    public ContactController(ContactService contactService,
                            ContactRateLimitService rateLimitService,
                            ClientIpResolver clientIpResolver) {
        this.contactService = contactService;
        this.rateLimitService = rateLimitService;
        this.clientIpResolver = clientIpResolver;
    }

    /**
     * Submits a contact form message.
     * This endpoint is publicly accessible but rate-limited.
     *
     * @param request    The contact form data
     * @param httpRequest The HTTP request (for IP extraction)
     * @return ContactResponse with reference ID or error response
     */
    @PostMapping
    public ResponseEntity<?> submitContactForm(
            @Valid @RequestBody ContactRequest request,
            HttpServletRequest httpRequest
    ) {
        String ipAddress = getClientIP(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        // Check rate limit
        if (!rateLimitService.allowContactSubmission(ipAddress)) {
            log.warn("Contact form rate limit exceeded for IP: {}", maskIp(ipAddress));
            return ResponseEntity.status(429).body(
                    new ErrorResponse("Too many requests. Please try again later.", "/api/contact")
            );
        }

        try {
            ContactResponse response = contactService.submitContactForm(request, ipAddress, userAgent);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing contact form submission: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(
                    new ErrorResponse("An error occurred while processing your message. Please try again.", "/api/contact")
            );
        }
    }

    /**
     * Securely extracts the client IP address from the request.
     *
     * <p>Delegates to {@link ClientIpResolver} which validates that forwarded
     * headers only come from trusted proxies, preventing IP spoofing attacks.</p>
     *
     * @param request The HTTP servlet request
     * @return The validated client IP address
     */
    private String getClientIP(HttpServletRequest request) {
        return clientIpResolver.resolveClientIp(request);
    }

    private String maskIp(String ip) {
        if (ip == null) return "unknown";
        if (ip.contains(".")) {
            int lastDot = ip.lastIndexOf('.');
            return ip.substring(0, lastDot) + ".xxx";
        }
        return ip.substring(0, Math.min(ip.length(), 10)) + ":xxx";
    }
}
