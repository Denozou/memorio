package com.memorio.backend.learning;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID>{
    List<QuizQuestion> findByQuizIdOrderByDisplayOrder(UUID quizId);//занйти всі питання до квізy
}
