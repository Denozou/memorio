package com.memorio.backend.auth.dto;

public class CheckAuthResponse {

    private boolean authenticated;
    private UserInfoDto user;

    public CheckAuthResponse(boolean authenticated, UserInfoDto user){
        this.authenticated = authenticated;
        this.user = user;
    }

    public boolean isAuthenticated(){return authenticated;}
    public UserInfoDto getUser(){return user;}

    public void setAuthenticated(boolean authenticated){
        this.authenticated = authenticated;
    }
    public void setUser(UserInfoDto user){
        this.user = user;
    }


}
