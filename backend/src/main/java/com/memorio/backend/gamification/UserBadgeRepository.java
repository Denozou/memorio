package com.memorio.backend.gamification;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface UserBadgeRepository extends JpaRepository<UserBadge, UUID>{
    List<UserBadge> findByUserId(UUID userId);
    boolean existsByUserIdAndCode(UUID userId, String code);

}

