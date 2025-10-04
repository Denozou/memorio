package com.memorio.backend.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class AdminController {
    @GetMapping("/admin/ping")
    public Map<String, String> ping(){
        return Map.of("ok", "admin");
    }
}
