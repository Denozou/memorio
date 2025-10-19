package com.memorio.backend.faces;


import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Random;

@Service
public class FacePickerService {

    // amazonq-ignore-next-line
    private final PersonRepository personRepository;
    private final Random random = new Random();

    public FacePickerService(PersonRepository personRepository){
        this.personRepository = personRepository;
    }

    public List<Person> pickFaces(int skillLevel, int count){
        int level = Math.max(1, Math.min(skillLevel, 10));
        int maxDifficulty = calculateMaxDifficulty(level);

        List<Person> candidates = personRepository.findRandomActivePersonsByMaxDifficultyLevel(maxDifficulty, count *2);
        if(candidates.size() <= count){
            return candidates;
        }

        Collections.shuffle(candidates, random);
        return candidates.subList(0, count);
    }


    private int calculateMaxDifficulty(int skillLevel){
        if(skillLevel <= 3){
            return 1;
        }else if (skillLevel <=6){ //easy + medium
            return 2;
        }else{
            return 3; //all difficultues
        }

    }

    public boolean hasEnoughFaces(int requiredCount){
        return personRepository.count()>= requiredCount;
    }
}
