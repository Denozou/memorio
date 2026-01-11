package com.memorio.backend.gamification;

import com.memorio.backend.common.security.AuthenticationUtil;
import com.memorio.backend.gamification.dto.LeaderboardPageDTO;
import com.memorio.backend.gamification.dto.LeaderboardPaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.UUID;

@RestController
@RequestMapping({"/leaderboard", "/api/leaderboard"})
@Tag(name = "Gamification", description = "Leaderboards, points, badges, and user statistics")
@SecurityRequirement(name = "bearerAuth")
public class LeaderboardController {
    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService){
        this.leaderboardService = leaderboardService;
    }

    @Operation(
        summary = "Get user's leaderboard page",
        description = "Retrieve the leaderboard page containing the current user's position and surrounding users."
    )
    @ApiResponse(responseCode = "200", description = "Leaderboard page retrieved",
        content = @Content(schema = @Schema(implementation = LeaderboardPaginatedResponse.class)))
    @GetMapping
    public ResponseEntity<LeaderboardPaginatedResponse> getMyLeaderboardPage(Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        LeaderboardPaginatedResponse response = leaderboardService.getUserLeaderboardPage(userId);
        return ResponseEntity.ok(response);
    }

    @Operation(
        summary = "Get leaderboard page by number",
        description = "Retrieve a specific page of the leaderboard with user rankings."
    )
    @ApiResponse(responseCode = "200", description = "Leaderboard page retrieved",
        content = @Content(schema = @Schema(implementation = LeaderboardPageDTO.class)))
    @GetMapping("/page/{pageNumber}")
    public ResponseEntity<LeaderboardPageDTO> getLeaderboardPage(
            @Parameter(description = "Page number (0-indexed)") @PathVariable int pageNumber,
            Authentication auth){
        UUID userId = AuthenticationUtil.extractUserId(auth);
        LeaderboardPageDTO page = leaderboardService.getLeaderboardPage(pageNumber, userId);
        return ResponseEntity.ok(page);
    }
}
