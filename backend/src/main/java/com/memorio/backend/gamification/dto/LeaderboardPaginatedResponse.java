package com.memorio.backend.gamification.dto;

public class LeaderboardPaginatedResponse {

    private final LeaderboardPageDTO currentPage;
    private final long currentUserRank;
    private final long totalUsers;
    private final Integer nextPageNumber;
    private final Integer previousPageNumber;

    public LeaderboardPaginatedResponse(LeaderboardPageDTO currentPage,
                                        long currentUserRank,
                                        long totalUsers,
                                        Integer nextPageNumber,
                                        Integer previousPageNumber) {
        this.currentPage = currentPage;
        this.currentUserRank = currentUserRank;
        this.totalUsers = totalUsers;
        this.nextPageNumber = nextPageNumber;
        this.previousPageNumber = previousPageNumber;
    }
    public LeaderboardPageDTO getCurrentPage() { return currentPage; }
    public long getCurrentUserRank() { return currentUserRank; }
    public long getTotalUsers() { return totalUsers; }
    public Integer getNextPageNumber() { return nextPageNumber; }
    public Integer getPreviousPageNumber() { return previousPageNumber; }

}
