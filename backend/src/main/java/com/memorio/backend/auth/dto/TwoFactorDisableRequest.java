package com.memorio.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class TwoFactorDisableRequest {

    @NotBlank(message = "Password is required")
    private String password;

    @NotBlank(message = "Verification code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "Code must be exactly 6 digits")
    private String code;

    public TwoFactorDisableRequest(){}
    public TwoFactorDisableRequest(String password, String code){
        this.password = password;
        this.code = code;
    }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
}
