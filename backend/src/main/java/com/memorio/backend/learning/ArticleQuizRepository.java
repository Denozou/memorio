package com.memorio.backend.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;


public interface ArticleQuizRepository extends JpaRepository<ArticleQuiz, UUID>{
    Optional<ArticleQuiz> findByArticleId(UUID articleId); //знайти квіз для конкретної статті
}
