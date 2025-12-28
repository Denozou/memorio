package com.memorio.backend.contact;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for ContactMessage entity.
 * Includes methods for spam detection and abuse monitoring.
 */
@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, UUID> {

    Optional<ContactMessage> findByReferenceId(String referenceId);

    /**
     * Count messages from a specific email within a time window.
     * Used for per-email rate limiting.
     */
    @Query("SELECT COUNT(c) FROM ContactMessage c WHERE c.senderEmail = :email AND c.createdAt > :since")
    long countBySenderEmailSince(@Param("email") String email, @Param("since") OffsetDateTime since);

    /**
     * Count messages from a specific IP within a time window.
     * Used for per-IP rate limiting and abuse detection.
     */
    @Query("SELECT COUNT(c) FROM ContactMessage c WHERE c.ipAddress = :ip AND c.createdAt > :since")
    long countByIpAddressSince(@Param("ip") String ipAddress, @Param("since") OffsetDateTime since);

    /**
     * Count spam messages from a specific IP within a time window.
     * High spam count indicates a malicious actor.
     */
    @Query("SELECT COUNT(c) FROM ContactMessage c WHERE c.ipAddress = :ip AND c.spam = true AND c.createdAt > :since")
    long countSpamByIpAddressSince(@Param("ip") String ipAddress, @Param("since") OffsetDateTime since);

    /**
     * Find all pending messages for admin review.
     */
    Page<ContactMessage> findByStatusOrderByCreatedAtDesc(ContactMessage.ContactStatus status, Pageable pageable);

    /**
     * Find all non-spam messages for admin review.
     */
    @Query("SELECT c FROM ContactMessage c WHERE c.spam = false ORDER BY c.createdAt DESC")
    Page<ContactMessage> findAllNonSpam(Pageable pageable);

    /**
     * Check if the exact same message content was recently submitted (duplicate detection).
     */
    @Query("SELECT COUNT(c) > 0 FROM ContactMessage c WHERE c.senderEmail = :email AND c.message = :message AND c.createdAt > :since")
    boolean existsDuplicateMessage(@Param("email") String email, @Param("message") String message, @Param("since") OffsetDateTime since);
}
