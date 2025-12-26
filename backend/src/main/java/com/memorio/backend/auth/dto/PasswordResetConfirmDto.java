package com.memorio.backend.auth.dto;

import com.memorio.backend.common.validation.PasswordMatches;
import com.memorio.backend.common.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;

@PasswordMatches
public class PasswordResetConfirmDto {
    @NotBlank(message = "Token is required")
    private String token;

    @NotBlank(message = "Password is required")
    @StrongPassword
    private String newPassword;

    @NotBlank(message = "Password confirmation is required")
    private String confirmPassword;

    public PasswordResetConfirmDto() {}

    public PasswordResetConfirmDto(String token, String newPassword, String confirmPassword) {
        this.token = token;
        this.newPassword = newPassword;
        this.confirmPassword = confirmPassword;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getNewPassword() {
        return newPassword;
    }

    /**
     * Normalizes whitespace by trimming to prevent accidental trailing spaces.
     * Users sometimes paste passwords with trailing spaces, which can lock them out.
     */
    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    /**
     * Normalizes whitespace by trimming to prevent accidental trailing spaces.
     */
    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }
}
