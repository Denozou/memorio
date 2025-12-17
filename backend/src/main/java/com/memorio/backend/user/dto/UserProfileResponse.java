package com.memorio.backend.user.dto;
import com.memorio.backend.user.Role;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class UserProfileResponse {
    private UUID id;
    private String email;
    private String displayName;
    private String pictureUrl;
    private Role role;
    private int skillLevel;
    private String preferredLanguage;
    private OffsetDateTime createdAt;
    private List<LinkedProviderDto> linkedProviders;
    private boolean twoFactorEnabled;

    public UserProfileResponse(UUID id, String email, String displayName,
                               String pictureUrl, Role role, int skillLevel,
                               String preferredLanguage, OffsetDateTime createdAt,
                               List<LinkedProviderDto> linkedProviders, boolean twoFactorEnabled){
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.pictureUrl = pictureUrl;
        this.role = role;
        this.skillLevel = skillLevel;
        this.preferredLanguage = preferredLanguage;
        this.createdAt = createdAt;
        this.linkedProviders = linkedProviders;
        this.twoFactorEnabled = twoFactorEnabled;
    }

    public UUID getId(){return id;}
    public String getEmail(){return email;}
    public String getDisplayName(){return displayName;}
    public String getPictureUrl(){return pictureUrl;}
    public Role getRole(){return  role;}
    public int getSkillLevel(){return skillLevel;}
    public String getPreferredLanguage(){return preferredLanguage;}
    public OffsetDateTime getCreatedAt(){return createdAt;}
    public List<LinkedProviderDto> getLinkedProviders(){return linkedProviders;}
    public boolean isTwoFactorEnabled(){return twoFactorEnabled;}
}
