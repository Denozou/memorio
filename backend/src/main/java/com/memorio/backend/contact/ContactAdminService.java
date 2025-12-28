package com.memorio.backend.contact;

import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.contact.dto.ContactMessageDto;
import com.memorio.backend.contact.dto.UpdateContactStatusRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Service for admin operations on contact messages.
 * Provides functionality to view, update status, and manage contact submissions.
 */
@Service
public class ContactAdminService {

    private static final Logger log = LoggerFactory.getLogger(ContactAdminService.class);
    private static final int DEFAULT_PAGE_SIZE = 20;

    private final ContactMessageRepository contactMessageRepository;

    public ContactAdminService(ContactMessageRepository contactMessageRepository) {
        this.contactMessageRepository = contactMessageRepository;
    }

    /**
     * Retrieves a paginated list of all contact messages.
     *
     * @param page      Page number (0-indexed)
     * @param size      Page size
     * @param status    Optional status filter
     * @param includeSpam Whether to include spam messages
     * @return Page of ContactMessageDto
     */
    @Transactional(readOnly = true)
    public Page<ContactMessageDto> getContactMessages(int page, int size, String status, boolean includeSpam) {
        int pageSize = Math.min(size > 0 ? size : DEFAULT_PAGE_SIZE, 100);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<ContactMessage> messages;

        if (status != null && !status.isBlank()) {
            try {
                ContactMessage.ContactStatus contactStatus = ContactMessage.ContactStatus.valueOf(status.toUpperCase());
                messages = contactMessageRepository.findByStatusOrderByCreatedAtDesc(contactStatus, pageable);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        } else if (!includeSpam) {
            messages = contactMessageRepository.findAllNonSpam(pageable);
        } else {
            messages = contactMessageRepository.findAll(pageable);
        }

        return messages.map(ContactMessageDto::fromEntity);
    }

    /**
     * Retrieves a single contact message by ID.
     *
     * @param id Message UUID
     * @return ContactMessageDto
     */
    @Transactional(readOnly = true)
    public ContactMessageDto getContactMessage(UUID id) {
        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Contact message not found"));
        return ContactMessageDto.fromEntity(message);
    }

    /**
     * Retrieves a single contact message by reference ID.
     *
     * @param referenceId Human-readable reference ID (MEM-XXXXXXXX)
     * @return ContactMessageDto
     */
    @Transactional(readOnly = true)
    public ContactMessageDto getContactMessageByReference(String referenceId) {
        ContactMessage message = contactMessageRepository.findByReferenceId(referenceId)
                .orElseThrow(() -> new NotFoundException("Contact message not found"));
        return ContactMessageDto.fromEntity(message);
    }

    /**
     * Updates the status of a contact message.
     *
     * @param id      Message UUID
     * @param request Status update request
     * @param adminId ID of the admin making the update
     * @return Updated ContactMessageDto
     */
    @Transactional
    public ContactMessageDto updateContactStatus(UUID id, UpdateContactStatusRequest request, UUID adminId) {
        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Contact message not found"));

        try {
            ContactMessage.ContactStatus newStatus = ContactMessage.ContactStatus.valueOf(request.getStatus().toUpperCase());
            message.setStatus(newStatus);

            if (newStatus == ContactMessage.ContactStatus.REPLIED) {
                message.setRepliedAt(OffsetDateTime.now());
                message.setRepliedBy(adminId);
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + request.getStatus());
        }

        if (request.getAdminNotes() != null) {
            message.setAdminNotes(request.getAdminNotes());
        }

        message.setUpdatedAt(OffsetDateTime.now());
        contactMessageRepository.save(message);

        log.info("Contact message {} status updated to {} by admin {}", 
                message.getReferenceId(), message.getStatus(), adminId);

        return ContactMessageDto.fromEntity(message);
    }

    /**
     * Marks a message as spam.
     *
     * @param id Message UUID
     * @return Updated ContactMessageDto
     */
    @Transactional
    public ContactMessageDto markAsSpam(UUID id) {
        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Contact message not found"));

        message.setSpam(true);
        message.setStatus(ContactMessage.ContactStatus.SPAM);
        message.setUpdatedAt(OffsetDateTime.now());
        contactMessageRepository.save(message);

        log.info("Contact message {} marked as spam", message.getReferenceId());

        return ContactMessageDto.fromEntity(message);
    }

    /**
     * Marks a message as not spam (false positive).
     *
     * @param id Message UUID
     * @return Updated ContactMessageDto
     */
    @Transactional
    public ContactMessageDto markAsNotSpam(UUID id) {
        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Contact message not found"));

        message.setSpam(false);
        message.setStatus(ContactMessage.ContactStatus.PENDING);
        message.setUpdatedAt(OffsetDateTime.now());
        contactMessageRepository.save(message);

        log.info("Contact message {} marked as not spam", message.getReferenceId());

        return ContactMessageDto.fromEntity(message);
    }

    /**
     * Deletes a contact message permanently.
     * Only for spam/archived messages.
     *
     * @param id Message UUID
     */
    @Transactional
    public void deleteContactMessage(UUID id) {
        ContactMessage message = contactMessageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Contact message not found"));

        if (message.getStatus() != ContactMessage.ContactStatus.SPAM 
                && message.getStatus() != ContactMessage.ContactStatus.ARCHIVED) {
            throw new IllegalStateException("Only spam or archived messages can be deleted");
        }

        contactMessageRepository.delete(message);
        log.info("Contact message {} deleted", message.getReferenceId());
    }
}
