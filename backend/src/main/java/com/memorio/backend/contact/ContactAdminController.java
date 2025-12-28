package com.memorio.backend.contact;

import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.contact.dto.ContactMessageDto;
import com.memorio.backend.contact.dto.UpdateContactStatusRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Admin controller for managing contact form submissions.
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/api/admin/contact")
@PreAuthorize("hasRole('ADMIN')")
public class ContactAdminController {

    private final ContactAdminService contactAdminService;

    public ContactAdminController(ContactAdminService contactAdminService) {
        this.contactAdminService = contactAdminService;
    }

    /**
     * Lists all contact messages with optional filtering.
     *
     * @param page        Page number (0-indexed)
     * @param size        Page size (default 20, max 100)
     * @param status      Optional status filter (PENDING, REVIEWED, REPLIED, ARCHIVED, SPAM)
     * @param includeSpam Whether to include spam messages (default false)
     * @return Paginated list of contact messages
     */
    @GetMapping
    public ResponseEntity<Page<ContactMessageDto>> listContactMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean includeSpam
    ) {
        Page<ContactMessageDto> messages = contactAdminService.getContactMessages(page, size, status, includeSpam);
        return ResponseEntity.ok(messages);
    }

    /**
     * Gets a single contact message by UUID.
     *
     * @param id Message UUID
     * @return Contact message details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ContactMessageDto> getContactMessage(@PathVariable UUID id) {
        ContactMessageDto message = contactAdminService.getContactMessage(id);
        return ResponseEntity.ok(message);
    }

    /**
     * Gets a single contact message by reference ID.
     *
     * @param referenceId Human-readable reference ID (MEM-XXXXXXXX)
     * @return Contact message details
     */
    @GetMapping("/reference/{referenceId}")
    public ResponseEntity<ContactMessageDto> getContactMessageByReference(@PathVariable String referenceId) {
        ContactMessageDto message = contactAdminService.getContactMessageByReference(referenceId);
        return ResponseEntity.ok(message);
    }

    /**
     * Updates the status of a contact message.
     *
     * @param id      Message UUID
     * @param request Status update request
     * @return Updated contact message
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ContactMessageDto> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateContactStatusRequest request,
            Authentication authentication
    ) {
        UUID adminId = AuthenticationUtil.extractUserId(authentication);
        ContactMessageDto updated = contactAdminService.updateContactStatus(id, request, adminId);
        return ResponseEntity.ok(updated);
    }

    /**
     * Marks a message as spam.
     *
     * @param id Message UUID
     * @return Updated contact message
     */
    @PostMapping("/{id}/spam")
    public ResponseEntity<ContactMessageDto> markAsSpam(@PathVariable UUID id) {
        ContactMessageDto updated = contactAdminService.markAsSpam(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * Marks a message as not spam (false positive recovery).
     *
     * @param id Message UUID
     * @return Updated contact message
     */
    @PostMapping("/{id}/not-spam")
    public ResponseEntity<ContactMessageDto> markAsNotSpam(@PathVariable UUID id) {
        ContactMessageDto updated = contactAdminService.markAsNotSpam(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * Deletes a contact message permanently.
     * Only works for spam or archived messages.
     *
     * @param id Message UUID
     * @return Success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteMessage(@PathVariable UUID id) {
        contactAdminService.deleteContactMessage(id);
        return ResponseEntity.ok(Map.of("message", "Contact message deleted successfully"));
    }
}
