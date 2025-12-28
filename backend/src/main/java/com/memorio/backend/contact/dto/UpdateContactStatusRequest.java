package com.memorio.backend.contact.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO for updating contact message status by admin.
 */
public class UpdateContactStatusRequest {

    @NotNull(message = "Status is required")
    private String status;

    @Size(max = 2000, message = "Admin notes must not exceed 2000 characters")
    private String adminNotes;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }
}
