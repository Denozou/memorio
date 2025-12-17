package com.memorio.backend.auth;

import com.memorio.backend.common.error.DuplicateEmailException;
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
    private static final String DUMMY_PASSWORD_HASH=
            "$2a$10$abcdefghijklmnopqrstuv.EFVGADHIUWXJKLSTMNOPBCQRYZ01234";

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }
    @Transactional(readOnly = true)
    public boolean checkCredentials (String email, String rawPassword){
        Optional<User>userOpt = users.findByEmail(email);
       String hashToCompare = userOpt
               .map(User::getPasswordHash)
               .orElse(DUMMY_PASSWORD_HASH);
       boolean matches = passwordEncoder.matches(rawPassword, hashToCompare);
       return userOpt.isPresent() && matches;
    }

    @Transactional(readOnly = true)
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

        if (displayName == null || displayName.isBlank()) {
            throw new IllegalArgumentException("Display name cannot be null or empty");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        if (users.findByEmail(email).isPresent()){
            throw new DuplicateEmailException(email);
        }

        User user = new User();
        user.setDisplayName(displayName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setPreferredLanguage(preferredLanguage != null ? preferredLanguage : "en");
        user.setEmailVerified(false); // New users need to verify email
        return users.save(user);
    }

    @Transactional
    public void updatePassword(User user, String newRawPassword) {
        if(user == null){
            throw new IllegalArgumentException("User cannot be null");
        }
        if (newRawPassword == null || newRawPassword.isBlank()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }
        user.setPasswordHash(passwordEncoder.encode(newRawPassword));
        users.save(user);
    }
    @Transactional
    public User saveUser(User user){
        return users.save(user);
    }
}
