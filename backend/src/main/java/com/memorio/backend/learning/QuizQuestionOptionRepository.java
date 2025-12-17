package com.memorio.backend.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface QuizQuestionOptionRepository extends JpaRepository<QuizQuestionOption,UUID>{
    List<QuizQuestionOption> findByQuestionIdOrderByDisplayOrder(UUID questionId);//знайти всі варіанти відповідей

    List<QuizQuestionOption> findByQuestionIdAndIsCorrectTrue(UUID questionId);//знайти коректну відповідь
}
