package com.memorio.backend.contact.dto;

import java.time.OffsetDateTime;

/**
 * Response DTO for successful contact form submissions.
 */
public class ContactResponse {

    private final String message;
    private final String referenceId;
    private final OffsetDateTime timestamp;

    public ContactResponse(String message, String referenceId) {
        this.message = message;
        this.referenceId = referenceId;
        this.timestamp = OffsetDateTime.now();
    }

    public String getMessage() {
        return message;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public OffsetDateTime getTimestamp() {
        return timestamp;
    }
}
