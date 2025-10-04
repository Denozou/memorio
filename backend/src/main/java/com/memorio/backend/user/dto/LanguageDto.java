package com.memorio.backend.user.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class LanguageDto {
    @NotBlank(message = "language is required")
    @Pattern(regexp = "^[A-Za-z]{2,8}$", message = "invalid language code")
    private String language;

    public String getLanguage(){return language;}
    public void setLanguage(String language){
        this.language = language;
    }
}
