package com.memorio.backend.gamification;

import com.memorio.backend.gamification.dto.LeaderboardEntryDTO;
import com.memorio.backend.gamification.dto.LeaderboardPageDTO;
import com.memorio.backend.gamification.dto.LeaderboardPaginatedResponse;
import com.memorio.backend.user.User;
import com.memorio.backend.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;


@Service
public class LeaderboardService {

    private final UserStatsRepository statsRepo;
    private final UserRepository userRepo;
    private final TreeCalculator treeCalculator;

    private static final int PAGE_SIZE = 15;

    public LeaderboardService(UserStatsRepository statsRepo,
                              UserRepository userRepo,
                              TreeCalculator treeCalculator) {
        this.statsRepo = statsRepo;
        this.userRepo = userRepo;
        this.treeCalculator = treeCalculator;
    }
    @Transactional(readOnly = true)
    public LeaderboardPaginatedResponse getUserLeaderboardPage(UUID currentUserId){
        UserStats currentUserStats = statsRepo.findById(currentUserId).orElseGet(()-> new UserStats(currentUserId));
        long currentUserPoints = currentUserStats.getTotalPoints();
        long usersWithMorePoints = statsRepo.countUsersAbove(currentUserPoints);
        long currentUserRank = usersWithMorePoints +1;
        long totalUsers = statsRepo.count();
        int userPageNumber = (int) Math.ceil((double) currentUserRank/PAGE_SIZE);

        LeaderboardPageDTO page = getLeaderboardPage(userPageNumber, currentUserId, totalUsers);

        int totalPages = (int) Math.ceil((double) totalUsers/PAGE_SIZE);
        Integer nextPage = (userPageNumber < totalPages) ? userPageNumber+1 : null;
        Integer prevPage = (userPageNumber > 1) ? userPageNumber-1 : null;
        return new LeaderboardPaginatedResponse(
                page,
                currentUserRank,
                totalUsers,
                nextPage,
                prevPage
        );
    }
    @Transactional(readOnly = true)
    public LeaderboardPageDTO getLeaderboardPage(int pageNumber, UUID currentUserId) {
        long totalUsers = statsRepo.count();
        return getLeaderboardPage(pageNumber, currentUserId, totalUsers);
    }

    private LeaderboardPageDTO getLeaderboardPage(int pageNumber, UUID currentUserId, long totalUsers){
        if(pageNumber < 1){
            pageNumber = 1;
        }

        int totalPages  = (int) Math.ceil((double) totalUsers/PAGE_SIZE);
        List<UserStats> pageStats = statsRepo.findAll(
                PageRequest.of(
                        pageNumber - 1,
                        PAGE_SIZE,
                        Sort.by(Sort.Direction.DESC, "totalPoints")
                )
        ).getContent();

        List<UUID> userIds = pageStats.stream()
                .map(UserStats::getUserId)
                .collect(Collectors.toList());
        Map<UUID, User> userMap = userRepo.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, Function.identity()));
        List<LeaderboardEntryDTO> entries = new ArrayList<>();
        int offset = (pageNumber-1) * PAGE_SIZE;
        long currentRank = offset +1;
        for (UserStats stats : pageStats){
            boolean isCurrentUser = stats.getUserId().equals(currentUserId);
            User user = userMap.get(stats.getUserId());
            entries.add(createLeaderboardEntry(stats, user, currentRank, isCurrentUser));
            currentRank++;
        }

        boolean isCurrentUserPage = entries.stream().anyMatch(LeaderboardEntryDTO::isCurrentUser);
        int startRank = offset + 1;
        int endRank = offset + entries.size();
        return new LeaderboardPageDTO(
                pageNumber,
                totalPages,
                startRank,
                endRank,
                entries,
                isCurrentUserPage
        );
    }

    private LeaderboardEntryDTO createLeaderboardEntry(UserStats stats, User user,
                                                       long rank, boolean isCurrentUser){
        UUID userId = stats.getUserId();

        String displayName = getDisplayName(user);
        String pictureUrl = (user !=null) ? user.getPictureUrl():null;
        long points = stats.getTotalPoints();
        int trees = treeCalculator.calculateTrees(points);
        int level = TreeCalculator.calculateLevel(trees);
        return new LeaderboardEntryDTO(
                userId,
                displayName,
                pictureUrl,
                points,
                trees,
                level,
                rank,
                isCurrentUser
        );
    }

    private String getDisplayName(User user){
        if(user == null){
            return "Anonymous User";
        }
        if(user.getDisplayName() != null && !user.getDisplayName().isBlank()){
            return user.getDisplayName();
        }

        if(user.getEmail() != null){
            int atIndex = user.getEmail().indexOf('@');
            if(atIndex>0){
                return user.getEmail().substring(0, atIndex);
            }
        }
        return "Anonymous User";
    }
}
