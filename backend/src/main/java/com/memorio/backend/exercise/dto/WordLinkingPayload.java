package com.memorio.backend.exercise.dto;
import java.util.List;
import java.util.Objects;

public class ImageLinkingPayload {

    private final List<String> words;

    public ImageLinkingPayload (List<String> words){
        this.words = Objects.requireNonNull(words, "words cannot be null");
    }
    public List<String> getWords(){
        return words;
    }


}
