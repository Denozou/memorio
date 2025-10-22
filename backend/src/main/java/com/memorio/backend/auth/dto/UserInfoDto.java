package com.memorio.backend.auth.dto;

import java.util.UUID;

public class UserInfoDto {
    private UUID id;
    private String email;
    private String displayName;
    private String role;

    public UserInfoDto(UUID id, String email, String displayName, String role){
        this.id = id;
        this.email = email;
        this.displayName = displayName;
        this.role = role;
    }

    public UUID getId(){return id;}
    public String getEmail(){return email;}
    public String getDisplayName(){return displayName;}
    public String getRole(){return role;}


    public void setId(UUID id){
        this.id = id;
    }
    public void setEmail(String email){
        this.email = email;
    }
    public void setDisplayName (String displayName){
        this.displayName = displayName;
    }
    public void setRole(String role){
        this.role = role;
    }

}
