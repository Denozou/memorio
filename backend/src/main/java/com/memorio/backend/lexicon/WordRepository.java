package com.memorio.backend.lexicon;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;
public interface WordRepository extends JpaRepository<Word, UUID> {
    @Query("""
            SELECT w FROM Word w 
            WHERE w.language = :language
            ORDER BY CASE WHEN w.freqRank IS NULL THEN 1 ELSE 0 END, w.freqRank ASC
            """)
    List<Word> findAllByLanguageOrderByRank(String language);

    @Query("""
            SELECT w FROM Word w 
            WHERE w.language = :language
            ORDER BY CASE WHEN w.freqRank IS NULL THEN 1 ELSE 0 END, w.freqRank ASC
            """)
    List<Word> findByLanguageWithPagination(@Param("language") String language, Pageable pageable);

    @Query("""
            SELECT COUNT(w) FROM Word w 
            WHERE w.language = :language
            """)
    int countByLanguage(@Param("language") String language);

    @Query("SELECT COALESCE (MAX(w.freqRank), 0) FROM Word w WHERE w.language = :language")
    Integer findMaxRankByLanguage(String language);

    @Query("SELECT LOWER(w.text) FROM Word w WHERE w.language = :language")
    List<String> findAllLowerTextsByLanguage(String language);

    boolean existsByLanguageAndTextIgnoreCase(String language, String text);

    @Query(value = """
            SELECT * FROM words
            WHERE language = :language
            ORDER BY random()
            LIMIT :limit
            """, nativeQuery = true)
    List<Word> findRandomByLanguage(@Param("language") String language, @Param("limit") int limit);

    @Query("""
            SELECT w.language AS code, COUNT(w) AS count
            FROM Word w GROUP BY w.language
            ORDER BY w.language
            """)
    List<LanguageRow> findLanguagesWithCounts();

    interface LanguageRow {
        String getCode();
        long getCount();
    }
}