package com.memorio.backend.exercise;

import org.springframework.stereotype.Service;
import java.util.*;
@Service
public class NumberPegService {

    private final NumberPegHintRepository repository;

    public NumberPegService(NumberPegHintRepository repository){
        this.repository = repository;
    }
    public String getHintWord(int digit, String language){
        Optional<NumberPegHint> hint = repository
                .findByIdDigitAndIdLanguage(digit, language);

        if(hint.isPresent()){
            return hint.get().getHintWord();
        }

        return repository
                .findByIdDigitAndIdLanguage(digit, "en")
                .map(NumberPegHint::getHintWord)
                .orElse("unknown");
    }

    public List<Integer> generateDigitSequence(int skillLevel){
        int length = calculateSequenceLength(skillLevel);
        List<Integer> digits = new ArrayList<>();
        Random random = new Random();

        for (int i = 0; i < length; i ++){
            digits.add(random.nextInt(10));
        }
        return digits;
    }

    private int calculateSequenceLength(int skillLevel){
        int level = Math.max(1, Math.min(skillLevel, 10));

        return 4+(level *2);
    }
}
