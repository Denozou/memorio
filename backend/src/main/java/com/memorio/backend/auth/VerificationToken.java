package com.memorio.backend.auth;
import com.memorio.backend.user.User;
import jakarta.persistence.*;
import org.antlr.v4.runtime.Token;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "verification_tokens")
public class VerificationToken {
    @Id
    @UuidGenerator
    @Column(name= "id", columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(name = "token", nullable = false, unique = true, updatable = false)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false, length = 50, updatable = false)
    private TokenType tokenType;

    @Column(name = "expires_at", nullable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime expiresAt;

    @Column(name = "used_at", columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime usedAt;

    @CreationTimestamp
    @Column(name="created_at", updatable = false, columnDefinition = "TIMESTAMPTZ")
    private OffsetDateTime createdAt;

    @JdbcTypeCode(SqlTypes.INET)
    @Column(name = "request_ip", columnDefinition = "inet")
    private String requestIp;

    public VerificationToken(){

    }
    public VerificationToken(User user, String token, TokenType tokenType, OffsetDateTime expiresAt){
        this.user = user;
        this.token = token;
        this.tokenType = tokenType;
        this.expiresAt = expiresAt;
    }

    public VerificationToken(User user, String token, TokenType tokenType, OffsetDateTime expiresAt, String requestIp){
        this.user = user;
        this.token = token;
        this.tokenType = tokenType;
        this.expiresAt = expiresAt;
        this.requestIp = requestIp;
    }

    public boolean isExpired(){
        return OffsetDateTime.now().isAfter(expiresAt);
    }

    public boolean isUsed(){
        return usedAt != null;
    }

    public boolean isValid(){
        return !isExpired()&& !isUsed();
    }

    public void markAsUsed(){
        if (this.isUsed()) {
            throw new IllegalStateException("Token already used");
        }
        this.usedAt = OffsetDateTime.now();
    }
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public TokenType getTokenType() {
        return tokenType;
    }

    public void setTokenType(TokenType tokenType) {
        this.tokenType = tokenType;
    }

    public OffsetDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(OffsetDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public OffsetDateTime getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(OffsetDateTime usedAt) {
        this.usedAt = usedAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getRequestIp() {
        return requestIp;
    }

    public void setRequestIp(String requestIp) {
        this.requestIp = requestIp;
    }
}
