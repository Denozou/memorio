package com.memorio.backend.user;
import com.memorio.backend.common.error.NotFoundException;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.UUID;

@Service
public class UserService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final EntityManager entityManager;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder, EntityManager entityManager) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public long countUsers(){
        return users.count();
    }

    @Transactional
    public User createUser(String email, String rawPassword){
        if(email == null || email.isBlank()){
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        if(rawPassword == null || rawPassword.isBlank()){
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        if (users.existsByEmail(email)){
            throw new IllegalArgumentException("Email already exists");
        }
        User u = new User();
        u.setEmail(email);
        String hash = passwordEncoder.encode(rawPassword);
        u.setPasswordHash(hash);
        u.setRole(Role.USER);

        User saved = users.save(u);
        users.flush();

        return users.findById(saved.getId())
                .orElseThrow(() -> new IllegalStateException("just-saved user not found"));
    }

    @Transactional(readOnly = true)
    public User getUser(UUID id){
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        return users.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
    }

    @Transactional(readOnly = true)
    public User getByEmail(String email){
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        return users.findByEmail(email).orElseThrow(() -> new NotFoundException("User Not found"));
    }

    @Transactional
    public void markTutorialCompleted(UUID userId) {
        User user = getUser(userId);
        user.setTutorialCompleted(true);
        users.save(user);
    }
}