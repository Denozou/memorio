package com.memorio.backend.exercise.dto;
import java.util.Objects;
public class FaceData {
    private final String personName;
    private final String displayName;
    private final String imageUrl;

    public FaceData(String personName, String displayName, String imageUrl){
        this.personName = Objects.requireNonNull(personName, "personName cannto be null") ;
        this.displayName = Objects.requireNonNull(displayName, "displayName cannot be null");
        this.imageUrl = Objects.requireNonNull(imageUrl, "imageUrl cannot be null");
    }

    public String getPersonName(){return personName;}
    public String getDisplayName(){return displayName;}
    public String getImageUrl(){return imageUrl;}


}

