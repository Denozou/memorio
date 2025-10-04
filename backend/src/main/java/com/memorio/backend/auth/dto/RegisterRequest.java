package com.memorio.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank(message = "Display name is required")
    @Size(min=2, max = 100, message = "Display name must be between 2 and 100 characters")
    private String displayName;
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password should be at least 8 characters long")
    private String password;
    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;

    private String preferredLanguage = "en";

    public String getDisplayName(){return displayName;}
    public void setDisplayName(String displayName){
        this.displayName = displayName;
    }
    public String getEmail(){return email;}
    public void setEmail(String email){
        this.email = email;
    }
    public String getPassword(){return password;}
    public void setPassword(String password){
        this.password = password;
    }
    public String getConfirmPassword(){return confirmPassword;}
    public void setConfirmPassword(String confirmPassword){
        this.confirmPassword = confirmPassword;
    }
    public String getPreferredLanguage(){return preferredLanguage;}
    public void setPreferredLanguage(String preferredLanguage){
        this.preferredLanguage = preferredLanguage;
    }

}
