package com.memorio.backend.gamification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.UUID;
public interface UserStatsRepository extends  JpaRepository<UserStats, UUID> {

    @Query("SELECT COUNT(us) FROM UserStats us WHERE us.totalPoints > :points")
    long countUsersAbove(@Param("points") long points);
}
