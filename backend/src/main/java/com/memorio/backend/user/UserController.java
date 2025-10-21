package com.memorio.backend.user;
import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.user.dto.UserResponse;
import com.memorio.backend.user.dto.CreateUserRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService service;
    public UserController(UserService service){
        this.service = service;
    }
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> count() {
        long count = service.countUsers();
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CreateUserRequest req) {
       User u = service.createUser(req.getEmail(), req.getPassword());
       UserResponse body = new UserResponse(u.getId(), u.getEmail(), u.getCreatedAt());
       return ResponseEntity.created(URI.create("/users/" + u.getId())).body(body);
    }

    @GetMapping("/{id}")
    // amazonq-ignore-next-line
    public ResponseEntity<UserResponse> get(@PathVariable UUID id){
        User u = service.getUser(id);
        UserResponse body = new UserResponse(u.getId(), u.getEmail(), u.getCreatedAt());
        return ResponseEntity.ok(body);
    }
    @GetMapping("/me")
    // amazonq-ignore-next-line
    public ResponseEntity<UserResponse> me(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        User u = service.getUser(userId);
        UserResponse body = new UserResponse(u.getId(), u.getEmail(), u.getCreatedAt());
        return ResponseEntity.ok(body);
    }
}
