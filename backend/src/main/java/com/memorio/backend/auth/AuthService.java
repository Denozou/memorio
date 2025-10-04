package com.memorio.backend.auth;

import com.memorio.backend.user.User;
import com.memorio.backend.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;
import com.memorio.backend.user.User;
@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }
    @Transactional(readOnly = true)
    public boolean checkCredentials (String email, String rawPassword){
        return users.findByEmail(email).map(u -> passwordEncoder.matches(rawPassword, u.getPasswordHash())).
                orElse(false);
    }

    @Transactional
    public Optional<User> findByEmail(String email){
        return users.findByEmail(email);
    }
    @Transactional(readOnly = true)
    public Optional<User> findById(UUID id){
        return users.findById(id);
    }

    @Transactional
    public User registerUser(String displayName, String email, String rawPassword,
                             String preferredLanguage){
        if (users.findByEmail(email).isPresent()){
            throw new RuntimeException("User with this email already exists");
        }

        User user = new User();
        user.setDisplayName(displayName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setPreferredLanguage(preferredLanguage != null ? preferredLanguage : "en");
        return users.save(user);
    }
}
