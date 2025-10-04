package com.memorio.backend.auth.dto;

import java.time.Instant;

public class LoginResponse
{
   private final String accessToken;
   private final Instant expiresAt;
   private final String tokenType = "Bearer";
   private final String refreshToken;

    public LoginResponse(String accessToken, Instant expiresAt, String refreshToken){
        this.accessToken = accessToken;
        this.expiresAt = expiresAt;
        this.refreshToken = refreshToken;
    }
    public String getAccessToken() { return accessToken; }
    public Instant getExpiresAt() { return expiresAt; }
    public String getTokenType() { return tokenType; }
    public String getRefreshToken(){return refreshToken; }
}
