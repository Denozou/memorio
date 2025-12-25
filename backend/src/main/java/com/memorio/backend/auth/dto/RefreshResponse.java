package com.memorio.backend.auth.dto;

public class RefreshResponse {

    private String message;
    private Long expiresAt; // Unix timestamp in milliseconds
    
    public RefreshResponse(String message, Long expiresAt){
        this.message = message;
        this.expiresAt = expiresAt;
    }

    public String getMessage(){return message;}

    public void setMessage(String message){
        this.message = message;
    }
    
    public Long getExpiresAt(){return expiresAt;}
    
    public void setExpiresAt(Long expiresAt){
        this.expiresAt = expiresAt;
    }
}
