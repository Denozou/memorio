package com.memorio.backend.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO for contact form submissions.
 * Includes comprehensive validation and honeypot field for bot detection.
 */
public class ContactRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 254, message = "Email must not exceed 254 characters")
    private String email;

    @NotBlank(message = "Subject is required")
    @Size(min = 5, max = 200, message = "Subject must be between 5 and 200 characters")
    private String subject;

    @NotBlank(message = "Message is required")
    @Size(min = 20, max = 5000, message = "Message must be between 20 and 5000 characters")
    private String message;

    /**
     * Honeypot field - should always be empty.
     * Bots typically fill in all fields, so a filled honeypot indicates spam.
     * Named 'companyFax' to avoid browser autofill (which fills 'website').
     */
    private String companyFax;

    /**
     * Timestamp when form was loaded (for timing-based bot detection).
     * Forms submitted too quickly (< 3 seconds) are likely bots.
     */
    private Long formLoadedAt;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCompanyFax() {
        return companyFax;
    }

    public void setCompanyFax(String companyFax) {
        this.companyFax = companyFax;
    }

    public Long getFormLoadedAt() {
        return formLoadedAt;
    }

    public void setFormLoadedAt(Long formLoadedAt) {
        this.formLoadedAt = formLoadedAt;
    }
}
