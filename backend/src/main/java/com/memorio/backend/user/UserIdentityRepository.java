package com.memorio.backend.user;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface UserIdentityRepository extends JpaRepository<UserIdentity, UUID>{
    Optional<UserIdentity> findByProviderAndProviderUserId(String provider, String providerUserId);
    Optional<UserIdentity> findByUserIdAndProvider(UUID userId, String provider);
}
