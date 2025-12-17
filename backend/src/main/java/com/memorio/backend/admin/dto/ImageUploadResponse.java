package com.memorio.backend.admin.dto;

public class ImageUploadResponse {
    private final String imageId;
    private final String message;

    public ImageUploadResponse(String imageId, String message) {
        this.imageId = imageId;
        this.message = message;
    }

    public String getImageId() { return imageId; }
    public String getMessage() { return message; }
}