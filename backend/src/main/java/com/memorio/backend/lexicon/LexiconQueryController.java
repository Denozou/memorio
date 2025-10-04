package com.memorio.backend.lexicon;

import com.memorio.backend.user.dto.LanguageDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/lexicon")
public class LexiconQueryController {
    private final WordRepository words;

    public LexiconQueryController(WordRepository words){
        this.words = words;
    }

    @GetMapping("/languages")
    public ResponseEntity<List<LanguageDto>> languages(){
        var rows = words.findLanguagesWithCounts();
        var out = rows.stream().map((row-> new LanguageDto(row.getCode(), row.getCount())))
                .toList();
        return ResponseEntity.ok(out);
    }

    public record LanguageDto (String code, long count){

    }
}
