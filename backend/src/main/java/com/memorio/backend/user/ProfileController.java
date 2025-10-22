package com.memorio.backend.user;
import com.memorio.backend.common.error.NotFoundException;
import com.memorio.backend.gamification.ProgressController;
import com.memorio.backend.user.dto.LanguageDto;
import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.user.dto.LinkedProviderDto;
import com.memorio.backend.user.dto.UpdateProfileRequest;
import com.memorio.backend.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.management.RuntimeMBeanException;
import java.util.Map;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;
@RestController
@RequestMapping("/users")
public class ProfileController {
    private final UserRepository users;
    private final UserIdentityRepository userIdentityRepository;

    public ProfileController(UserRepository users, UserIdentityRepository userIdentityRepository){
        this.users = users;
        this.userIdentityRepository = userIdentityRepository;
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
                linkedProviders
        );
        return ResponseEntity.ok(response);
    }
    @PutMapping("/profile")
    @Transactional
    public ResponseEntity<UserProfileResponse> updateProfile(Authentication auth,
                                                             @RequestBody @Valid UpdateProfileRequest request){
        try{
            UUID userId = AuthenticationUtil.extractUserId(auth);
            User user = users.findById(userId).orElseThrow(()->new RuntimeException("User not found"));
            if (request.getDisplayName() != null){
                user.setDisplayName(request.getDisplayName());
            }
            if(request.getEmail() != null){
                user.setEmail(request.getEmail());
            }
            if(request.getPictureUrl() != null){
                user.setPictureUrl(request.getPictureUrl());
            }
            if (request.getPreferredLanguage() != null){
                user.setPreferredLanguage(request.getPreferredLanguage());
            }
            user = users.save(user);

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
                    linkedProviders

            );
            return ResponseEntity.ok(response);

        }catch (Exception e){
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
    public ResponseEntity<?> setLanguage(Authentication auth, @RequestBody @Valid LanguageDto req){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        var u = users.findById(userId).orElseThrow();
        u.setPreferredLanguage(req.getLanguage().toLowerCase());
        users.save(u);
        return ResponseEntity.ok(Map.of("language", u.getPreferredLanguage()));
    }


}
