package com.memorio.backend.lexicon;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class LexiconImportService {

    private final WordRepository wordRepo;
    private static final int MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final int BATCH_SIZE = 500;

    public LexiconImportService(WordRepository wordRepo){
        this.wordRepo = wordRepo;
    }

    @Transactional
    public ImportResult importPlainList(MultipartFile file, String language, String pos){
        if (language == null || language.isEmpty() || pos == null || pos.isEmpty()){
            throw new IllegalArgumentException("Language and part of speech must be provided");
        }
        if (file == null || file.isEmpty() || file.getSize()> MAX_FILE_SIZE){
            throw new IllegalArgumentException("File is empty or exceeds maximum size");
        }
        try{
            Set<String>existingLower = new HashSet<>(wordRepo.findAllLowerTextsByLanguage(language));
            int baseRank = Optional.ofNullable(wordRepo.findMaxRankByLanguage(language)).orElse(0);
            List<Word> batch = new ArrayList<>();
            int totalLines = 0;
            int inserted = 0;
            int skipped = 0;

            try(BufferedReader br = new BufferedReader(
                    new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))){
                String line;
                while ((line = br.readLine()) != null){
                    totalLines++;
                    String text = line.trim();
                    if (text.isEmpty()){
                        skipped++;
                        continue;
                    }
                    String key = text.toLowerCase(Locale.ROOT);
                    if (existingLower.contains(key)){
                        skipped++;
                        continue;
                    }
                    Word w = new Word(
                            UUID.randomUUID(),
                            language,
                            text,
                            text,
                            pos,
                            baseRank + inserted + 1,
                            OffsetDateTime.now()
                    );
                    batch.add(w);
                    existingLower.add(key);
                    inserted++;
                    if(batch.size() >= BATCH_SIZE){
                        wordRepo.saveAll(batch);
                        batch.clear();
                    }
                }

            }
            if (!batch.isEmpty()){
                wordRepo.saveAll(batch);
            }
            return new ImportResult(totalLines, inserted, skipped);


        } catch (IOException e){
            throw new IllegalStateException("Failed to read from file: " + e.getMessage(), e);
        } catch (Exception e){
            throw new IllegalStateException("Failed to import words: " + e.getMessage(), e);
        }
    }
    public record ImportResult(int totalLines, int inserted, int skipped) {}

}
