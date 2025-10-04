package com.memorio.backend.exercise.dto;
import java.util.List;

public class ImageLinkingPayload {

    private final List<String> words;

    public ImageLinkingPayload (List<String> words){
        this.words = words;
    }
    public List<String> getWords(){
        return words;
    }


}
