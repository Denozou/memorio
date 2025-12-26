package com.memorio.backend.auth.dto;

import com.memorio.backend.common.validation.PasswordMatches;
import com.memorio.backend.common.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

@PasswordMatches
public class RegisterRequest {
    @NotBlank(message = "Display name is required")
    @Size(min=2, max = 100, message = "Display name must be between 2 and 100 characters")
    @Pattern(regexp = "^[a-zA-Z0-9 ._-]+$", message = "Display name can only contain letters, numbers, spaces, and ._- characters")
    private String displayName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @StrongPassword
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
