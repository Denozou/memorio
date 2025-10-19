package com.memorio.backend.user;
import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;
import java.time.OffsetDateTime;
import java.util.UUID;
@Entity
@Table(name = "user_identities",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"provider", "provider_user_id"}),
                             @UniqueConstraint(columnNames = {"user_id", "provider"})})
public class UserIdentity {
    @Id
    @UuidGenerator
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "provider", nullable = false, length = 32)
    private String provider;
    @Column(name = "provider_user_id", nullable = false, length = 255)
    private String providerUserId;
    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
    @Column(name = "updated_at", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public UUID getId(){return id;}
    public User getUser(){return user;}
    public void setUser(User user){
        this.user = user;
    }
    public String getProvider(){return provider;}
    public void setProvider(String provider){
        this.provider = provider;
    }
    public String getProviderUserId(){return providerUserId;}
    public void setProviderUserId(String providerUserId){
        this.providerUserId = providerUserId;
    }

    public OffsetDateTime getCreatedAt(){return createdAt;}
    public OffsetDateTime getUpdatedAt(){return updatedAt;}

}
