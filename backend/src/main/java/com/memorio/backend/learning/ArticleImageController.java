package com.memorio.backend.learning;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Separate controller for article images without /api prefix.
 * This handles requests when nginx strips the /api prefix.
 */
@RestController
@RequestMapping("/learning")
public class ArticleImageController {

    private final ArticleImageService articleImageService;

    public ArticleImageController(ArticleImageService articleImageService) {
        this.articleImageService = articleImageService;
    }

    @GetMapping("/images/{imageId}")
    public ResponseEntity<byte[]> getImage(@PathVariable UUID imageId) {
        ArticleImage image = articleImageService.getImage(imageId);

        return ResponseEntity.ok()
                .header("Content-Type", image.getContentType())
                .header("Content-Length", String.valueOf(image.getFileSize()))
                .header("Cache-Control", "public, max-age=31536000")
                .body(image.getImageData());
    }
}
