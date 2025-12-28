package com.memorio.backend.contact;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Index;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entity for persisting contact form submissions.
 * Stores all messages for audit trail, abuse detection, and admin review.
 */
@Entity
@Table(name = "contact_messages", indexes = {
        @Index(name = "idx_contact_messages_email", columnList = "sender_email"),
        @Index(name = "idx_contact_messages_ip", columnList = "ip_address"),
        @Index(name = "idx_contact_messages_status", columnList = "status"),
        @Index(name = "idx_contact_messages_created", columnList = "created_at")
})
public class ContactMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "reference_id", nullable = false, unique = true, length = 20)
    private String referenceId;

    @Column(name = "sender_name", nullable = false, length = 100)
    private String senderName;

    @Column(name = "sender_email", nullable = false, length = 254)
    private String senderEmail;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContactStatus status = ContactStatus.PENDING;

    @Column(name = "spam_score")
    private Integer spamScore = 0;

    @Column(name = "spam_reasons", length = 500)
    private String spamReasons;

    @Column(name = "is_spam", nullable = false)
    private boolean spam = false;

    @Column(name = "email_sent", nullable = false)
    private boolean emailSent = false;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "replied_at")
    private OffsetDateTime repliedAt;

    @Column(name = "replied_by")
    private UUID repliedBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum ContactStatus {
        PENDING,
        REVIEWED,
        REPLIED,
        ARCHIVED,
        SPAM
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

    public ContactStatus getStatus() {
        return status;
    }

    public void setStatus(ContactStatus status) {
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
