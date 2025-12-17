package com.memorio.backend.exercise;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface NumberPegHintRepository extends JpaRepository<NumberPegHint, NumberPegHintId>{

    Optional<NumberPegHint> findByIdDigitAndIdLanguage(Integer digit, String language);

    List<NumberPegHint> findByIdLanguage(String language);

    boolean existsByIdLanguage(String language);
}
