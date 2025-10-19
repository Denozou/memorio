package com.memorio.backend.exercise.dto;
import java.util.List;

public class FaceNamePayload {
    private final List<FaceData> faces;

    public FaceNamePayload(List<FaceData> faces){
        this.faces = faces;
    }

    public List<FaceData> getFaces(){
        return faces;
    }

}
