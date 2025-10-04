package com.memorio.backend.auth;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
public class MeController {
    @GetMapping("/me")
    public Map<String, String> me(Authentication auth){
        return Map.of("subject", auth.getName());
    }
}
