package com.memorio.backend.user.dto;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
public class UpdateProfileRequest {
    @Size(max = 100, message = "Display name must be less then 100 characters")
    private String displayName;

    @Email(message = "Email must be valid")
    private String email;

    private String pictureUrl;

    @Size(min = 2, max = 8, message = "Language code must be between 2 and 8 characters")
    private String preferredLanguage;

    public UpdateProfileRequest(){

    }
    public UpdateProfileRequest(String displayName, String email, String pictureUrl,
                                String preferredLanguage){
        this.displayName = displayName;
        this.email = email;
        this.pictureUrl = pictureUrl;
        this.preferredLanguage = preferredLanguage;
    }

    public String getDisplayName(){return displayName;}
    public void setDisplayName(String displayName){
        this.displayName = displayName;
    }

    public String getEmail(){return email;}
    public void setEmail(String email){
        this.email = email;
    }
    public String getPictureUrl(){return pictureUrl;}
    public void setPictureUrl(String pictureUrl){
        this.pictureUrl = pictureUrl;
    }
    public String getPreferredLanguage(){return preferredLanguage;}
    public void setPreferredLanguage(String preferredLanguage){
        this.preferredLanguage = preferredLanguage;
    }
}
