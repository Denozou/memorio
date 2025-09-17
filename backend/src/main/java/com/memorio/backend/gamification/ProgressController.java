package com.memorio.backend.gamification;
import com.memorio.backend.gamification.dto.ProgressResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.stream.Collectors;
@RestController
@RequestMapping("/progress")
public class ProgressController {
    private final UserStatsRepository statsRepo;
    private final UserBadgeRepository badgeRepo;

    public ProgressController(UserStatsRepository statsRepo, UserBadgeRepository badgeRepo){
        this.statsRepo = statsRepo;
        this.badgeRepo = badgeRepo;
    }

    @GetMapping
    public ResponseEntity<ProgressResponse> get(Authentication auth){
        var userId =  UUID.fromString(auth.getName());
        var stats = statsRepo.findById(userId).orElseGet(() -> new UserStats(userId));
        var badges = badgeRepo.findByUserId(userId).stream().map(UserBadge::getCode).collect(Collectors.toList());
        var resp = new ProgressResponse(
                stats.getTotalPoints(),
                stats.getTotalAttempts(),
                stats.getTotalCorrect(),
                badges
        );
        return ResponseEntity.ok(resp);
    }
}
