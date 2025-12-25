package com.memorio.backend.auth.dto;

import java.util.UUID;

public class AuthSuccessResponse {
    private String message;
    private UserInfoDto user;
    private Long expiresAt; // Unix timestamp in milliseconds

    public AuthSuccessResponse(String message, UserInfoDto user, Long expiresAt){
        this.message = message;
        this.user = user;
        this.expiresAt = expiresAt;
    }

    public String getMessage(){
        return message;
    }
    public UserInfoDto getUser(){return user;}
    
    public Long getExpiresAt(){return expiresAt;}

    public void setMessage(String message){
        this.message = message;
    }
    public void setUser(UserInfoDto user){
        this.user = user;
    }
    
    public void setExpiresAt(Long expiresAt){
        this.expiresAt = expiresAt;
    }


}

