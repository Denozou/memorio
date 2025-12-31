package com.memorio.backend.gamification;

import com.memorio.backend.gamification.dto.LeaderboardPageDTO;
import com.memorio.backend.gamification.dto.LeaderboardPaginatedResponse;
import com.memorio.backend.user.User;
import com.memorio.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaderboardService Unit Tests")
class LeaderboardServiceTest {

    @Mock
    private UserStatsRepository statsRepo;

    @Mock
    private UserRepository userRepo;

    @Mock
    private TreeCalculator treeCalculator;

    @InjectMocks
    private LeaderboardService leaderboardService;

    private User testUser;
    private User otherUser;
    private UserStats testUserStats;
    private UserStats otherUserStats;

    @BeforeEach
    void setUp() throws Exception {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setDisplayName("Test User");

        otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        otherUser.setEmail("other@example.com");
        otherUser.setDisplayName("Other User");

        testUserStats = new UserStats(testUser.getId());
        setPrivateField(testUserStats, "totalPoints", 1000L);

        otherUserStats = new UserStats(otherUser.getId());
        setPrivateField(otherUserStats, "totalPoints", 2000L);
    }

    private void setPrivateField(Object obj, String fieldName, Object value) throws Exception {
        Field field = obj.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(obj, value);
    }

    @Nested
    @DisplayName("getUserLeaderboardPage tests")
    class GetUserLeaderboardPageTests {

        @Test
        @DisplayName("Should return page containing current user")
        void shouldReturnPageContainingCurrentUser() {
            when(statsRepo.findById(testUser.getId())).thenReturn(Optional.of(testUserStats));
            when(statsRepo.countUsersAbove(1000L)).thenReturn(1L);
            when(statsRepo.count()).thenReturn(10L);

            Page<UserStats> page = new PageImpl<>(List.of(otherUserStats, testUserStats));
            when(statsRepo.findAll(any(Pageable.class))).thenReturn(page);
            when(userRepo.findAllById(anyList())).thenReturn(List.of(otherUser, testUser));
            when(treeCalculator.calculateTrees(anyLong())).thenReturn(10);

            LeaderboardPaginatedResponse result = leaderboardService.getUserLeaderboardPage(testUser.getId());

            assertNotNull(result);
            assertEquals(2L, result.getCurrentUserRank());
            assertEquals(10L, result.getTotalUsers());
            assertTrue(result.getCurrentPage().getEntries().stream()
                    .anyMatch(e -> e.getUserId().equals(testUser.getId()) && e.isCurrentUser()));
        }

        @Test
        @DisplayName("Should create default stats for new user")
        void shouldCreateDefaultStatsForNewUser() {
            UUID newUserId = UUID.randomUUID();
            when(statsRepo.findById(newUserId)).thenReturn(Optional.empty());
            when(statsRepo.countUsersAbove(0L)).thenReturn(10L);
            when(statsRepo.count()).thenReturn(10L);

            Page<UserStats> page = new PageImpl<>(List.of(testUserStats));
            when(statsRepo.findAll(any(Pageable.class))).thenReturn(page);
            when(userRepo.findAllById(anyList())).thenReturn(List.of(testUser));
            when(treeCalculator.calculateTrees(anyLong())).thenReturn(10);

            LeaderboardPaginatedResponse result = leaderboardService.getUserLeaderboardPage(newUserId);

            assertEquals(11L, result.getCurrentUserRank());
        }

        @Test
        @DisplayName("Should calculate pagination correctly")
        void shouldCalculatePaginationCorrectly() {
            when(statsRepo.findById(testUser.getId())).thenReturn(Optional.of(testUserStats));
            when(statsRepo.countUsersAbove(1000L)).thenReturn(0L);
            when(statsRepo.count()).thenReturn(30L);

            Page<UserStats> page = new PageImpl<>(List.of(testUserStats));
            when(statsRepo.findAll(any(Pageable.class))).thenReturn(page);
            when(userRepo.findAllById(anyList())).thenReturn(List.of(testUser));
            when(treeCalculator.calculateTrees(anyLong())).thenReturn(10);

            LeaderboardPaginatedResponse result = leaderboardService.getUserLeaderboardPage(testUser.getId());

            assertNotNull(result.getNextPageNumber());
            assertNull(result.getPreviousPageNumber());
        }
    }

    @Nested
    @DisplayName("getLeaderboardPage tests")
    class GetLeaderboardPageTests {

        @Test
        @DisplayName("Should return correct page with entries")
        void shouldReturnCorrectPageWithEntries() {
            when(statsRepo.count()).thenReturn(30L);
            Page<UserStats> page = new PageImpl<>(List.of(otherUserStats, testUserStats));
            when(statsRepo.findAll(any(Pageable.class))).thenReturn(page);
            when(userRepo.findAllById(anyList())).thenReturn(List.of(otherUser, testUser));
            when(treeCalculator.calculateTrees(anyLong())).thenReturn(10);

            LeaderboardPageDTO result = leaderboardService.getLeaderboardPage(1, testUser.getId());

            assertNotNull(result);
            assertEquals(1, result.getPageNumber());
            assertEquals(2, result.getEntries().size());
            assertTrue(result.isCurrentUserPage());
        }

        @Test
        @DisplayName("Should handle page number less than 1")
        void shouldHandlePageNumberLessThan1() {
            when(statsRepo.count()).thenReturn(10L);
            Page<UserStats> page = new PageImpl<>(List.of(testUserStats));
            when(statsRepo.findAll(any(Pageable.class))).thenReturn(page);
            when(userRepo.findAllById(anyList())).thenReturn(List.of(testUser));
            when(treeCalculator.calculateTrees(anyLong())).thenReturn(10);

            LeaderboardPageDTO result = leaderboardService.getLeaderboardPage(0, testUser.getId());

            assertEquals(1, result.getPageNumber());
        }

        @Test
        @DisplayName("Should calculate ranks correctly for entries")
        void shouldCalculateRanksCorrectly() {
            when(statsRepo.count()).thenReturn(2L);
            Page<UserStats> page = new PageImpl<>(List.of(otherUserStats, testUserStats));
            when(statsRepo.findAll(any(Pageable.class))).thenReturn(page);
            when(userRepo.findAllById(anyList())).thenReturn(List.of(otherUser, testUser));
            when(treeCalculator.calculateTrees(anyLong())).thenReturn(10);

            LeaderboardPageDTO result = leaderboardService.getLeaderboardPage(1, testUser.getId());

            assertEquals(1, result.getStartRank());
            assertEquals(2, result.getEndRank());
        }

        @Test
        @DisplayName("Should handle missing user gracefully")
        void shouldHandleMissingUserGracefully() {
            when(statsRepo.count()).thenReturn(2L);
            Page<UserStats> page = new PageImpl<>(List.of(testUserStats));
            when(statsRepo.findAll(any(Pageable.class))).thenReturn(page);
            when(userRepo.findAllById(anyList())).thenReturn(List.of()); // User not found
            when(treeCalculator.calculateTrees(anyLong())).thenReturn(10);

            LeaderboardPageDTO result = leaderboardService.getLeaderboardPage(1, testUser.getId());

            assertEquals("Anonymous User", result.getEntries().get(0).getDisplayName());
        }

        @Test
        @DisplayName("Should use email prefix when display name is null")
        void shouldUseEmailPrefixWhenDisplayNameNull() {
            testUser.setDisplayName(null);
            when(statsRepo.count()).thenReturn(1L);
            Page<UserStats> page = new PageImpl<>(List.of(testUserStats));
            when(statsRepo.findAll(any(Pageable.class))).thenReturn(page);
            when(userRepo.findAllById(anyList())).thenReturn(List.of(testUser));
            when(treeCalculator.calculateTrees(anyLong())).thenReturn(10);

            LeaderboardPageDTO result = leaderboardService.getLeaderboardPage(1, testUser.getId());

            assertEquals("test", result.getEntries().get(0).getDisplayName());
        }

        @Test
        @DisplayName("Should use email prefix when display name is blank")
        void shouldUseEmailPrefixWhenDisplayNameBlank() {
            testUser.setDisplayName("   ");
            when(statsRepo.count()).thenReturn(1L);
            Page<UserStats> page = new PageImpl<>(List.of(testUserStats));
            when(statsRepo.findAll(any(Pageable.class))).thenReturn(page);
            when(userRepo.findAllById(anyList())).thenReturn(List.of(testUser));
            when(treeCalculator.calculateTrees(anyLong())).thenReturn(10);

            LeaderboardPageDTO result = leaderboardService.getLeaderboardPage(1, testUser.getId());

            assertEquals("test", result.getEntries().get(0).getDisplayName());
        }

        @Test
        @DisplayName("Should mark current user in entries")
        void shouldMarkCurrentUserInEntries() {
            when(statsRepo.count()).thenReturn(2L);
            Page<UserStats> page = new PageImpl<>(List.of(otherUserStats, testUserStats));
            when(statsRepo.findAll(any(Pageable.class))).thenReturn(page);
            when(userRepo.findAllById(anyList())).thenReturn(List.of(otherUser, testUser));
            when(treeCalculator.calculateTrees(anyLong())).thenReturn(10);

            LeaderboardPageDTO result = leaderboardService.getLeaderboardPage(1, testUser.getId());

            var testUserEntry = result.getEntries().stream()
                    .filter(e -> e.getUserId().equals(testUser.getId()))
                    .findFirst()
                    .orElseThrow();
            assertTrue(testUserEntry.isCurrentUser());

            var otherUserEntry = result.getEntries().stream()
                    .filter(e -> e.getUserId().equals(otherUser.getId()))
                    .findFirst()
                    .orElseThrow();
            assertFalse(otherUserEntry.isCurrentUser());
        }
    }
}
