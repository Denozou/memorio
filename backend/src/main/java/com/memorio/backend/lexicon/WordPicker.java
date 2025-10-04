package com.memorio.backend.lexicon;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
@Service
public class WordPicker {

    private final WordRepository repo;
    private final Random rng = new Random();
    public WordPicker(WordRepository repo){
        this.repo = repo;
    }

    public List<String>pickWords(String language, int level, int count){
        int totalWords = repo.countByLanguage(language);
        if(totalWords == 0) return List.of();

        int windowSize = Math.min(1000, Math.max(count*2, (int)Math.ceil(totalWords*0.2)));
        int totalLevels = Math.max(1,10);
        int pos = Math.max(1, Math.min(level, 10))-1;
        int start = (int)Math.round((pos/(double)(totalLevels-1)) * Math.max(0, totalWords-windowSize));
        List<Word> windowWords = repo.findByLanguageWithPagination(language,
                PageRequest.of(start/Math.max(1, windowSize), windowSize));

        if (windowWords.isEmpty()) return List.of();
        List<Integer> indices = new ArrayList<>();
        for (int i = 0; i<windowWords.size(); i++){
            indices.add(i);
        }
        Collections.shuffle(indices, rng);
        List<String>out = new ArrayList<>();
        for (int i = 0; i < indices.size() && out.size() < count; i++){
            out.add(windowWords.get(indices.get(i)).getText());
        }
        return out;
    }

    public List<String> pickRandom(String language, int count){
        return repo.findRandomByLanguage(language, count).stream()
                .map(Word::getText)
                .toList();
    }

}
