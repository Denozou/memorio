package com.memorio.backend.exercise.dto;
import java.util.List;
import java.util.Objects;

public class FaceNamePayload {
    private final List<FaceData> faces;

    public FaceNamePayload(List<FaceData> faces){
        this.faces = Objects.requireNonNull(faces, "faces cannot be null");
    }

    public List<FaceData> getFaces(){
        return faces;
    }

}
