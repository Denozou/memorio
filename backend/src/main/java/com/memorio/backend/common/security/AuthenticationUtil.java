package com.memorio.backend.common.security;
import org.springframework.security.core.Authentication;
import java.util.UUID;

public class AuthenticationUtil {
    private AuthenticationUtil()
    {

    }

    public static UUID extractUserId(Authentication auth){
        if(auth == null || auth.getName() == null){
            throw new IllegalStateException("Authentication pricipal is null");
        }
        try{
            return UUID.fromString(auth.getName());
        }catch (IllegalArgumentException e){
            throw new IllegalArgumentException(
                    "Invalid UUID format in authentication :"
                            +auth.getName(), e);
        }
    }
}
