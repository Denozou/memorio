package com.memorio.backend.learning;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class ArticleImageService {

    private final ArticleImageRepository imageRepository;
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_TYPES = Arrays.asList(
            "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    public ArticleImageService(ArticleImageRepository imageRepository) {
        this.imageRepository = imageRepository;
    }

    /**
     * Store uploaded image for an article.
     */
    public ArticleImage storeImage(Article article, MultipartFile file) throws IOException {
        // Validate
        validateImage(file);

        // Read image data
        byte[] imageData = file.getBytes();

        // Get dimensions
        BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(imageData));
        Integer width = bufferedImage != null ? bufferedImage.getWidth() : null;
        Integer height = bufferedImage != null ? bufferedImage.getHeight() : null;

        // Create entity
        ArticleImage articleImage = new ArticleImage(
                article,
                file.getOriginalFilename(),
                imageData,
                file.getContentType(),
                width,
                height
        );

        return imageRepository.save(articleImage);
    }

    /**
     * Get image by ID.
     */
    public ArticleImage getImage(UUID imageId) {
        return imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found"));
    }

    /**
     * Delete image.
     */
    public void deleteImage(UUID imageId) {
        imageRepository.deleteById(imageId);
    }

    /**
     * Validate uploaded image.
     */
    private void validateImage(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload empty file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException(
                    "File size exceeds maximum of " + (MAX_FILE_SIZE / 1024 / 1024) + "MB"
            );
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Invalid file type. Allowed: JPEG, PNG, GIF, WebP"
            );
        }
    }
}