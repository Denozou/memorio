package com.memorio.backend.user;
import com.memorio.backend.auth.CookieUtil;
import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.user.dto.UserResponse;
import com.memorio.backend.user.dto.UserDataExportDto;
import com.memorio.backend.user.dto.CreateUserRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@Tag(name = "Users", description = "User account management and GDPR operations")
public class UserController {
    private final UserService service;
    private final UserDataExportService dataExportService;
    private final CookieUtil cookieUtil;

    public UserController(UserService service, UserDataExportService dataExportService, CookieUtil cookieUtil){
        this.service = service;
        this.dataExportService = dataExportService;
        this.cookieUtil = cookieUtil;
    }
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> count() {
        long count = service.countUsers();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateUserRequest req) {
       User u = service.createUser(req.getEmail(), req.getPassword());
       UserResponse body = new UserResponse(u.getId(), u.getEmail(), u.getCreatedAt());
       return ResponseEntity.created(URI.create("/users/" + u.getId())).body(body);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> get(@PathVariable UUID id){
        User u = service.getUser(id);
        UserResponse body = new UserResponse(u.getId(), u.getEmail(), u.getCreatedAt());
        return ResponseEntity.ok(body);
    }
    @GetMapping("/me")
    // amazonq-ignore-next-line
    public ResponseEntity<UserResponse> me(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        User u = service.getUser(userId);
        UserResponse body = new UserResponse(u.getId(), u.getEmail(), u.getCreatedAt());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/tutorial-status")
    public ResponseEntity<Map<String, Boolean>> getTutorialStatus(Authentication auth) {
        UUID userId = AuthenticationUtil.extractUserId(auth);
        User u = service.getUser(userId);
        return ResponseEntity.ok(Map.of("completed", u.isTutorialCompleted()));
    }

    @PostMapping("/complete-tutorial")
    public ResponseEntity<Map<String, Boolean>> completeTutorial(Authentication auth) {
        UUID userId = AuthenticationUtil.extractUserId(auth);
        service.markTutorialCompleted(userId);
        return ResponseEntity.ok(Map.of("completed", true));
    }

    // ========== GDPR Endpoints ==========

    @Operation(
        summary = "Export user data (GDPR)",
        description = "Export all personal data associated with the user's account. Returns a JSON file containing account info, exercise history, learning progress, and gamification data."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Data export successful"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping(value = "/me/export", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserDataExportDto> exportMyData(Authentication auth) {
        UUID userId = AuthenticationUtil.extractUserId(auth);
        UserDataExportDto export = dataExportService.exportUserData(userId);

        String filename = "memorio-data-export-" +
                OffsetDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".json";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(export);
    }

    @Operation(
        summary = "Delete user account (GDPR)",
        description = "Permanently delete the user's account and all associated data. This action is irreversible. All exercise history, progress, badges, and personal information will be deleted."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Account deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Authentication required")
    })
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteMyAccount(
            Authentication auth,
            HttpServletResponse response) {
        UUID userId = AuthenticationUtil.extractUserId(auth);

        // Delete all user data
        dataExportService.deleteUserAccount(userId);

        // Clear authentication cookies
        cookieUtil.clearAuthCookies(response);

        return ResponseEntity.ok(Map.of(
                "message", "Account deleted successfully",
                "deletedAt", OffsetDateTime.now().toString()
        ));
    }
}
