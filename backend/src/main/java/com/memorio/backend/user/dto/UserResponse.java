package com.memorio.backend.user.dto;
import java.time.OffsetDateTime;
import java.util.UUID;

public class UserResponse {
    private UUID id;
    private String email;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public UserResponse(UUID id, String email, OffsetDateTime createdAt){
        this.id = id;
        this.email = email;
        this.createdAt = createdAt;
    }
    public UUID getId(){return id;}
    public String getEmail(){return email;}
    public OffsetDateTime getCreatedAt(){return createdAt;}
}
