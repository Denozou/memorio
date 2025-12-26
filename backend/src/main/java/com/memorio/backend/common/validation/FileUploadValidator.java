package com.memorio.backend.common.validation;

import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

/**
 * Validates file uploads for security and integrity.
 */
@Component
public class FileUploadValidator {

    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    );
    
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    );

    /**
     * Validates an image file upload.
     * 
     * @param file The uploaded file
     * @throws IllegalArgumentException if validation fails
     */
    public void validateImageUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Check file size
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new IllegalArgumentException(
                String.format("File size exceeds maximum allowed size of %d MB", MAX_IMAGE_SIZE / (1024 * 1024))
            );
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                "Invalid file type. Only JPEG, PNG, and WebP images are allowed"
            );
        }

        // Check file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new IllegalArgumentException("Filename cannot be empty");
        }

        String fileExtension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(fileExtension)) {
            throw new IllegalArgumentException(
                "Invalid file extension. Only .jpg, .jpeg, .png, and .webp are allowed"
            );
        }

        // Verify content type matches extension
        if (!isContentTypeMatchingExtension(contentType, fileExtension)) {
            throw new IllegalArgumentException(
                "File content type does not match file extension"
            );
        }

        // Check for potential path traversal in filename
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new IllegalArgumentException("Invalid filename: path traversal detected");
        }
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDotIndex);
    }

    private boolean isContentTypeMatchingExtension(String contentType, String extension) {
        return switch (extension) {
            case ".jpg", ".jpeg" -> contentType.equals("image/jpeg") || contentType.equals("image/jpg");
            case ".png" -> contentType.equals("image/png");
            case ".webp" -> contentType.equals("image/webp");
            default -> false;
        };
    }

    public long getMaxImageSize() {
        return MAX_IMAGE_SIZE;
    }
}
