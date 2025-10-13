package com.memorio.backend.faces;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
@Repository
public interface PersonRepository extends JpaRepository<Person, UUID> {
    Optional<Person> findByPersonName(String personName);
    List<Person> findByIsActiveTrue();
    List<Person> findByIsActiveTrueAndDifficultyLevel(int difficultyLevel);
    List<Person> findByIsActiveTrueAndDifficultyLevelLessThanEqual(int maxDifficultyLevel);
    long countByIsActiveTrueAndDifficultyLevel(int difficultyLevel);
    @Query(value = "SELECT * FROM persons WHERE is_active = true ORDER BY RANDOM() LIMIT :limit",
        nativeQuery = true)
    List<Person> findRandomActivePersons(@Param("limit") int limit);

    @Query(value = "SELECT * FROM persons WHERE is_active = true AND difficulty_level = :difficultyLevel ORDER BY RANDOM() LIMIT :limit",
            nativeQuery = true)
    List<Person> findRandomActivePersonsByDifficultyLevel(@Param("difficultyLevel") int difficultyLevel,
            @Param("limit") int limit);

    @Query(value = "SELECT * FROM persons WHERE is_active = true AND difficulty_level <= :maxDifficultyLevel ORDER BY RANDOM() LIMIT :limit",
            nativeQuery = true)
    List<Person> findRandomActivePersonsByMaxDifficultyLevel(@Param("maxDifficultyLevel") int maxDifficultyLevel,
                                                          @Param("limit") int limit);

    @Query("SELECT p.personName from Person p")
    List<String> findAllPersonNames();
}
