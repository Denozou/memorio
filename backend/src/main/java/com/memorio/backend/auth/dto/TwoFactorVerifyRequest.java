package com.memorio.backend.auth.dto;
import jakarta.validation.constraints.NotBlank;

public class TwoFactorVerifyRequest {

    @NotBlank(message = "Token is required")
    private String tempToken;

    @NotBlank(message = "Code is required")
    private String code;

    private boolean isBackupCode = false;

    public TwoFactorVerifyRequest(){}

    public TwoFactorVerifyRequest(String tempToken, String code, boolean isBackupCode){
        this.tempToken = tempToken;
        this.code = code;
        this.isBackupCode = isBackupCode;
    }

    public String getTempToken() { return tempToken; }
    public void setTempToken(String tempToken) { this.tempToken = tempToken; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public boolean isBackupCode() { return isBackupCode; }
    public void setBackupCode(boolean backupCode) { isBackupCode = backupCode; }
}
