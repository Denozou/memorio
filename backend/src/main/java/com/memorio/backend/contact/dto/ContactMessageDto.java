package com.memorio.backend.contact.dto;

import com.memorio.backend.contact.ContactMessage;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO for returning contact message details to admin.
 */
public class ContactMessageDto {

    private UUID id;
    private String referenceId;
    private String senderName;
    private String senderEmail;
    private String subject;
    private String message;
    private String ipAddress;
    private String userAgent;
    private String status;
    private Integer spamScore;
    private String spamReasons;
    private boolean spam;
    private boolean emailSent;
    private String adminNotes;
    private OffsetDateTime repliedAt;
    private UUID repliedBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static ContactMessageDto fromEntity(ContactMessage entity) {
        ContactMessageDto dto = new ContactMessageDto();
        dto.setId(entity.getId());
        dto.setReferenceId(entity.getReferenceId());
        dto.setSenderName(entity.getSenderName());
        dto.setSenderEmail(entity.getSenderEmail());
        dto.setSubject(entity.getSubject());
        dto.setMessage(entity.getMessage());
        dto.setIpAddress(entity.getIpAddress());
        dto.setUserAgent(entity.getUserAgent());
        dto.setStatus(entity.getStatus().name());
        dto.setSpamScore(entity.getSpamScore());
        dto.setSpamReasons(entity.getSpamReasons());
        dto.setSpam(entity.isSpam());
        dto.setEmailSent(entity.isEmailSent());
        dto.setAdminNotes(entity.getAdminNotes());
        dto.setRepliedAt(entity.getRepliedAt());
        dto.setRepliedBy(entity.getRepliedBy());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
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

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getSpamScore() {
        return spamScore;
    }

    public void setSpamScore(Integer spamScore) {
        this.spamScore = spamScore;
    }

    public String getSpamReasons() {
        return spamReasons;
    }

    public void setSpamReasons(String spamReasons) {
        this.spamReasons = spamReasons;
    }

    public boolean isSpam() {
        return spam;
    }

    public void setSpam(boolean spam) {
        this.spam = spam;
    }

    public boolean isEmailSent() {
        return emailSent;
    }

    public void setEmailSent(boolean emailSent) {
        this.emailSent = emailSent;
    }

    public String getAdminNotes() {
        return adminNotes;
    }

    public void setAdminNotes(String adminNotes) {
        this.adminNotes = adminNotes;
    }

    public OffsetDateTime getRepliedAt() {
        return repliedAt;
    }

    public void setRepliedAt(OffsetDateTime repliedAt) {
        this.repliedAt = repliedAt;
    }

    public UUID getRepliedBy() {
        return repliedBy;
    }

    public void setRepliedBy(UUID repliedBy) {
        this.repliedBy = repliedBy;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
