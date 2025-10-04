package com.memorio.backend.gamification;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_badges",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "code"})})
public class UserBadge {
    @Id
    private UUID id;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(nullable = false)
    private String code;
    @Column(name = "awarded_at", nullable = false)
    private OffsetDateTime awardedAt;

    protected UserBadge(){}
    public UserBadge(UUID id, UUID userId, String code, OffsetDateTime awardedAt){
        this.id = id;
        this.userId = userId;
        this.code = code;
        this.awardedAt = awardedAt;
    }

    public UUID getId(){return id;}
    public UUID getUserId(){return userId;}
    public String getCode(){return code;}
    public OffsetDateTime getAwardedAt(){ return awardedAt;}
}
