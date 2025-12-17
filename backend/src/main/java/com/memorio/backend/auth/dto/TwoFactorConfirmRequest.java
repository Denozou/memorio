package com.memorio.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class TwoFactorConfirmRequest {

    @NotBlank(message = "Verification code is required")
    @Pattern(regexp = "^[0-9]{6}$", message = "Code must be exactly 6 digits")
    private String code;

    public TwoFactorConfirmRequest(){}

    public TwoFactorConfirmRequest(String code){
        this.code = code;
    }

    public String getCode(){return code;}
    public void setCode(String code){
        this.code = code;
    }
}
