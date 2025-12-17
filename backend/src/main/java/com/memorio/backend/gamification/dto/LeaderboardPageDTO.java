package com.memorio.backend.gamification.dto;
import java.util.List;
public class LeaderboardPageDTO {

    private final int pageNumber;
    private final int totalPages;
    private final int startRank;
    private final int endRank;
    private final List<LeaderboardEntryDTO> entries;
    private final boolean isCurrentUserPage;

    public LeaderboardPageDTO(int pageNumber, int totalPages, int startRank,
                              int endRank, List<LeaderboardEntryDTO> entries,
                              boolean isCurrentUserPage){
        this.pageNumber = pageNumber;
        this.totalPages = totalPages;
        this.startRank = startRank;
        this.endRank = endRank;
        this.entries = entries;
        this.isCurrentUserPage = isCurrentUserPage;

    }
    public int getPageNumber() { return pageNumber; }
    public int getTotalPages() { return totalPages; }
    public int getStartRank() { return startRank; }
    public int getEndRank() { return endRank; }
    public List<LeaderboardEntryDTO> getEntries() { return entries; }
    public boolean isCurrentUserPage() { return isCurrentUserPage; }
}
