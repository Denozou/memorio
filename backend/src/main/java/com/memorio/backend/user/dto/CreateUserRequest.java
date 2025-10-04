package com.memorio.backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CreateUserRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;
    @NotBlank(message = "Password is required")
    @Size (min=6, max=72, message = "Password should be between 6 and 72 characters")
    private String password;

    public String getEmail(){return email;}
    public void setEmail(String email){
        this.email = email;
    }

    public String getPassword(){return password;}
    public void setPassword(String password){
        this.password=password;
    }
}
