package com.memorio.backend.auth.dto;

import java.util.UUID;

public class AuthSuccessResponse {
    private String message;
    private UserInfoDto user;

    public AuthSuccessResponse(String message, UserInfoDto user){
        this.message = message;
        this.user = user;
    }

    public String getMessage(){
        return message;
    }
    public UserInfoDto getUser(){return user;}

    public void setMessage(String message){
        this.message = message;
    }
    public void setUser(UserInfoDto user){
        this.user = user;
    }


}

