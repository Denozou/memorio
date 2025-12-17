package com.memorio.backend.gamification.dto;

import java.util.UUID;

public class LeaderboardEntryDTO {

    private final UUID userId;
    private final String displayName;
    private final String pictureUrl;
    private final long totalPoints;
    private final int trees;
    private final int level;
    private final long rank;
    private final boolean isCurrentUser;

    public LeaderboardEntryDTO(UUID userId, String displayName,
                               String pictureUrl, long totalPoints, int trees,
                               int level, long rank, boolean isCurrentUser){
        this.userId = userId;
        this.displayName = displayName;
        this.pictureUrl = pictureUrl;
        this.totalPoints = totalPoints;
        this.trees = trees;
        this.level = level;
        this.rank = rank;
        this.isCurrentUser = isCurrentUser;
    }
    public UUID getUserId() { return userId; }
    public String getDisplayName() { return displayName; }
    public String getPictureUrl() { return pictureUrl; }
    public long getTotalPoints() { return totalPoints; }
    public int getTrees() { return trees; }
    public int getLevel() { return level; }
    public long getRank() { return rank; }
    public boolean isCurrentUser() { return isCurrentUser; }

}
