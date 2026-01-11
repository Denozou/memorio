package com.memorio.backend.user;
import com.memorio.backend.auth.VerificationService;
import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.common.security.ClientIpResolver;
import com.memorio.backend.user.dto.LanguageDto;
import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.user.dto.LinkedProviderDto;
import com.memorio.backend.user.dto.UpdateProfileRequest;
import com.memorio.backend.user.dto.UserProfileResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;
@RestController
@RequestMapping("/users")
public class ProfileController {
    private final UserRepository users;
    private final UserIdentityRepository userIdentityRepository;
    private final VerificationService verificationService;
    private final ClientIpResolver clientIpResolver;

    public ProfileController(UserRepository users,
                            UserIdentityRepository userIdentityRepository,
                            VerificationService verificationService,
                            ClientIpResolver clientIpResolver) {
        this.users = users;
        this.userIdentityRepository = userIdentityRepository;
        this.verificationService = verificationService;
        this.clientIpResolver = clientIpResolver;
    }
    @GetMapping("/profile")
    @Transactional(readOnly = true)
    public ResponseEntity<UserProfileResponse> getProfile(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        User user = users.findById(userId).orElseThrow(
                ()->new NotFoundException("User not found"));

        List<LinkedProviderDto> linkedProviders = user.getIdentities().stream()
                .map(identity-> new LinkedProviderDto(
                        identity.getProvider(),
                        identity.getProviderUserId(),
                        identity.getCreatedAt()
                )).collect(Collectors.toList());

        UserProfileResponse response = new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getPictureUrl(),
                user.getRole(),
                user.getSkillLevel(),
                user.getPreferredLanguage(),
                user.getCreatedAt(),
                linkedProviders,
                user.isTwoFactorEnabled()
        );
        return ResponseEntity.ok(response);
    }
    @PutMapping("/profile")
    @Transactional
    public ResponseEntity<?> updateProfile(Authentication auth,
                                           @RequestBody @Valid UpdateProfileRequest request,
                                           HttpServletRequest httpRequest) {
        try {
            UUID userId = AuthenticationUtil.extractUserId(auth);
            User user = users.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

            boolean emailChangeInitiated = false;
            String pendingEmail = null;

            // Handle email change separately - requires verification
            if (request.getEmail() != null && !request.getEmail().equalsIgnoreCase(user.getEmail())) {
                String clientIp = clientIpResolver.resolveClientIp(httpRequest);
                boolean success = verificationService.initiateEmailChange(user, request.getEmail(), clientIp);
                if (!success) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Email address is already in use"));
                }
                emailChangeInitiated = true;
                pendingEmail = request.getEmail();
            }

            // Update other fields directly
            if (request.getDisplayName() != null) {
                user.setDisplayName(request.getDisplayName());
            }
            if (request.getPictureUrl() != null) {
                user.setPictureUrl(request.getPictureUrl());
            }
            if (request.getPreferredLanguage() != null) {
                user.setPreferredLanguage(request.getPreferredLanguage());
            }
            user = users.save(user);

            List<LinkedProviderDto> linkedProviders = user.getIdentities().stream()
                    .map(identity -> new LinkedProviderDto(
                            identity.getProvider(),
                            identity.getProviderUserId(),
                            identity.getCreatedAt()
                    )).collect(Collectors.toList());

            UserProfileResponse response = new UserProfileResponse(
                    user.getId(),
                    user.getEmail(),
                    user.getDisplayName(),
                    user.getPictureUrl(),
                    user.getRole(),
                    user.getSkillLevel(),
                    user.getPreferredLanguage(),
                    user.getCreatedAt(),
                    linkedProviders,
                    user.isTwoFactorEnabled()
            );

            // If email change was initiated, return additional info
            if (emailChangeInitiated) {
                return ResponseEntity.ok(Map.of(
                        "profile", response,
                        "emailChangeInitiated", true,
                        "pendingEmail", pendingEmail,
                        "message", "A verification email has been sent to your new email address. Please check your inbox to confirm the change."
                ));
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            throw new RuntimeException("Failed to update user profile", e);
        }
    }
    @GetMapping("/language")
    public ResponseEntity<?> getLanguage(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        var u = users.findById(userId).orElseThrow();
        String lang = u.getPreferredLanguage() != null ? u.getPreferredLanguage() : "en";
        return ResponseEntity.ok(Map.of("language", lang));
    }
    @PutMapping("/language")
    @Transactional
    public ResponseEntity<?> setLanguage(Authentication auth, @RequestBody @Valid LanguageDto req){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        var u = users.findById(userId).orElseThrow();
        String language = req.getLanguage();
        if (language == null || language.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Language is required"));
        }
        u.setPreferredLanguage(language.toLowerCase());
        users.save(u);
        return ResponseEntity.ok(Map.of("language", u.getPreferredLanguage()));
    }

}
