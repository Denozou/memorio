package com.memorio.backend.auth.dto;

public class RefreshResponse {

    private String message;
    public RefreshResponse(String message){
        this.message = message;
    }

    public String getMessage(){return message;}

    public void setMessage(String message){
        this.message = message;
    }
}
