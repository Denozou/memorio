package com.memorio.backend.auth;

import org.springframework.stereotype.Service;
import  java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {
    private static final int MAX_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15;

    private final Map<String, LoginAttempt> attemptsCache = new ConcurrentHashMap<>();

    public void loginSucceeded(String email){
        attemptsCache.remove(email);
    }

    public void loginFailed(String email){
        LoginAttempt attempt = attemptsCache.computeIfAbsent(email, k-> new LoginAttempt());
        synchronized (attempt){//  Synchronize modifications to prevent lost updates
            attempt.incrementAttempts();
            if(attempt.getAttempts() >= MAX_ATTEMPTS){
                attempt.setLockedUntil(LocalDateTime.now().plusMinutes(LOCKOUT_DURATION_MINUTES));
            }
        }
    }

    public boolean isBlocked(String email){
        LoginAttempt attempt = attemptsCache.get(email);

        if(attempt == null){
            return false;
        }
        synchronized (attempt){
            if(attempt.getLockedUntil() != null){
                if(LocalDateTime.now().isBefore(attempt.getLockedUntil())){
                    return true;
                }else{
                    attemptsCache.remove(email);
                    return  false;
                }
            }
        }
        return  false;
    }

    private static class LoginAttempt{
        private int attempts = 0;
        private LocalDateTime lockedUntil;

        public int getAttempts(){return attempts;}
        public void incrementAttempts(){
            attempts++;
        }

        public LocalDateTime getLockedUntil(){return lockedUntil;}
        public void setLockedUntil(LocalDateTime lockedUntil){
            this.lockedUntil = lockedUntil;
        }
    }
}

