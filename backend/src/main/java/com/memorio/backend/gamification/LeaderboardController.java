package com.memorio.backend.gamification;

import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.gamification.dto.LeaderboardPageDTO;
import com.memorio.backend.gamification.dto.LeaderboardPaginatedResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping("/leaderboard")
public class LeaderboardController {
    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService){
        this.leaderboardService = leaderboardService;
    }

    @GetMapping
    public ResponseEntity<LeaderboardPaginatedResponse> getMyLeaderboardPage(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        LeaderboardPaginatedResponse response = leaderboardService.getUserLeaderboardPage(userId);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/page/{pageNumber}")
    public ResponseEntity<LeaderboardPageDTO> getLeaderboardPage(@PathVariable int pageNumber,
                                                                 Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        LeaderboardPageDTO page = leaderboardService.getLeaderboardPage(pageNumber, userId);
        return ResponseEntity.ok(page);
    }
}
