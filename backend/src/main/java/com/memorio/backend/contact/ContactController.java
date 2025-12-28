package com.memorio.backend.contact;

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

    public ContactController(ContactService contactService, ContactRateLimitService rateLimitService) {
        this.contactService = contactService;
        this.rateLimitService = rateLimitService;
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
     * Extracts the client IP address from the request.
     * Handles proxy headers for applications behind load balancers.
     */
    private String getClientIP(HttpServletRequest request) {
        String[] headers = {
                "X-Forwarded-For",
                "X-Real-IP",
                "CF-Connecting-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP"
        };

        for (String header : headers) {
            String ip = extractIPFromHeader(request, header);
            if (ip != null) {
                return ip;
            }
        }

        return request.getRemoteAddr();
    }

    private String extractIPFromHeader(HttpServletRequest request, String headerName) {
        String value = request.getHeader(headerName);
        if (value == null || value.isEmpty() || "unknown".equalsIgnoreCase(value)) {
            return null;
        }

        int commaIndex = value.indexOf(',');
        if (commaIndex != -1) {
            value = value.substring(0, commaIndex).trim();
        } else {
            value = value.trim();
        }

        if (isValidIP(value)) {
            return value;
        }
        return null;
    }

    private boolean isValidIP(String ip) {
        if (ip == null || ip.isEmpty()) {
            return false;
        }
        // IPv4
        if (ip.matches("^(\\d{1,3}\\.){3}\\d{1,3}$")) {
            String[] parts = ip.split("\\.");
            for (String part : parts) {
                try {
                    int num = Integer.parseInt(part);
                    if (num < 0 || num > 255) {
                        return false;
                    }
                } catch (NumberFormatException e) {
                    return false;
                }
            }
            return true;
        }
        // IPv6 (basic check)
        if (ip.contains(":") && ip.matches("^[0-9a-fA-F:]+$")) {
            return true;
        }
        return false;
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
