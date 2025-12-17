package com.memorio.backend.auth.dto;

public class TwoFactorRequiredResponse {

    private String message;
    private String tempToken;

    private boolean twoFactorRequired = true;

    public TwoFactorRequiredResponse(){}

    public TwoFactorRequiredResponse(String tempToken){
        this.message = "Two-factor authentication required";
        this.tempToken = tempToken;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTempToken() { return tempToken; }
    public void setTempToken(String tempToken) { this.tempToken = tempToken; }

    public boolean isTwoFactorRequired() { return twoFactorRequired; }
    public void setTwoFactorRequired(boolean twoFactorRequired) { this.twoFactorRequired = twoFactorRequired; }
}
