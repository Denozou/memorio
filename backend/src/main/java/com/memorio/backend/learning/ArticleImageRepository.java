package com.memorio.backend.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ArticleImageRepository extends JpaRepository<ArticleImage, UUID> {
    Optional<ArticleImage> findByArticleId(UUID articleId);
}