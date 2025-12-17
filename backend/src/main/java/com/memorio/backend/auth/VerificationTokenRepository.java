package com.memorio.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;


@Repository
public interface VerificationTokenRepository extends JpaRepository <VerificationToken, UUID>{

    Optional<VerificationToken> findByToken(String token);

    Optional<VerificationToken> findByUserIdAndTokenType(UUID userId, TokenType tokenType);


    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT vt FROM VerificationToken vt WHERE vt.token = :token AND vt.usedAt IS NULL AND vt.expiresAt > :now")
    Optional<VerificationToken> findByTokenAndUsedAtIsNullAndExpiresAtAfter(@Param("token") String token, @Param("now") OffsetDateTime now);

    @Transactional
    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") OffsetDateTime now);

    @Transactional
    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.user.id = :userId AND vt.tokenType = :tokenType")
    void deleteByUserIdAndTokenType(@Param("userId") UUID userId, @Param("tokenType") TokenType tokenType);

    @Transactional
    @Modifying
    @Query("DELETE FROM VerificationToken vt WHERE vt.usedAt IS NOT NULL")
    void deleteUsedTokens();
}
