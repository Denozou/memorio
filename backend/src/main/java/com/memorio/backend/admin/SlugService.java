package com.memorio.backend.admin;

import com.memorio.backend.learning.ArticleRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Service for generating and validating URL-safe slugs for articles.
 * Ensures uniqueness and proper formatting.
 */
@Service
public class SlugService {

    private final ArticleRepository articleRepository;
    
    // Regex pattern for valid slugs: lowercase letters, numbers, hyphens only
    private static final Pattern VALID_SLUG_PATTERN = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");
    private static final int MAX_SLUG_LENGTH = 100;
    
    public SlugService(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    /**
     * Generate a URL-safe slug from a title.
     * Handles Unicode characters, removes special characters, and ensures proper formatting.
     * 
     * @param title The article title to convert to a slug
     * @return A URL-safe slug
     */
    public String generateSlug(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new IllegalArgumentException("Title cannot be empty");
        }

        // Normalize Unicode characters (é -> e, ñ -> n, etc.)
        String normalized = Normalizer.normalize(title, Normalizer.Form.NFD);
        
        // Remove diacritical marks
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        
        // Convert to lowercase
        String slug = normalized.toLowerCase();
        
        // Replace spaces and underscores with hyphens
        slug = slug.replaceAll("[\\s_]+", "-");
        
        // Remove all characters that are not alphanumeric or hyphens
        slug = slug.replaceAll("[^a-z0-9-]", "");
        
        // Remove leading/trailing hyphens
        slug = slug.replaceAll("^-+|-+$", "");
        
        // Replace multiple consecutive hyphens with a single hyphen
        slug = slug.replaceAll("-{2,}", "-");
        
        // Truncate to max length, ensuring we don't cut in the middle of a word
        if (slug.length() > MAX_SLUG_LENGTH) {
            slug = slug.substring(0, MAX_SLUG_LENGTH);
            // Remove trailing hyphen if truncation created one
            slug = slug.replaceAll("-+$", "");
        }
        
        // If slug is empty after sanitization, generate a generic one
        if (slug.isEmpty()) {
            slug = "article";
        }
        
        return slug;
    }

    /**
     * Generate a unique slug by appending a number if necessary.
     * 
     * @param baseSlug The base slug to make unique
     * @param excludeArticleId Optional article ID to exclude from uniqueness check (for updates)
     * @return A unique slug
     */
    public String generateUniqueSlug(String baseSlug, UUID excludeArticleId) {
        String slug = baseSlug;
        int counter = 2;
        
        // Check if slug exists, increment counter if needed
        while (isSlugTaken(slug, excludeArticleId)) {
            // Ensure the numbered version doesn't exceed max length
            String suffix = "-" + counter;
            if (baseSlug.length() + suffix.length() > MAX_SLUG_LENGTH) {
                slug = baseSlug.substring(0, MAX_SLUG_LENGTH - suffix.length()) + suffix;
            } else {
                slug = baseSlug + suffix;
            }
            counter++;
            
            // Prevent infinite loops (highly unlikely but good practice)
            if (counter > 1000) {
                // Append a random UUID component as last resort
                slug = baseSlug.substring(0, Math.min(baseSlug.length(), 90)) + "-" + UUID.randomUUID().toString().substring(0, 8);
                break;
            }
        }
        
        return slug;
    }

    /**
     * Check if a slug is already taken by another article.
     * 
     * @param slug The slug to check
     * @param excludeArticleId Optional article ID to exclude from check (for updates)
     * @return true if slug is taken, false otherwise
     */
    private boolean isSlugTaken(String slug, UUID excludeArticleId) {
        return articleRepository.findBySlug(slug)
                .map(article -> {
                    // If we're updating an article, its own slug is not "taken"
                    if (excludeArticleId != null) {
                        return !article.getId().equals(excludeArticleId);
                    }
                    return true;
                })
                .orElse(false);
    }

    /**
     * Validate that a slug meets all requirements.
     * 
     * @param slug The slug to validate
     * @return true if valid, false otherwise
     */
    public boolean isValidSlug(String slug) {
        if (slug == null || slug.isEmpty()) {
            return false;
        }
        
        if (slug.length() > MAX_SLUG_LENGTH) {
            return false;
        }
        
        return VALID_SLUG_PATTERN.matcher(slug).matches();
    }

    /**
     * Sanitize and validate a user-provided slug.
     * If the slug is invalid, generate a new one from the title.
     * 
     * @param userProvidedSlug The slug provided by the user
     * @param title The article title (fallback for generation)
     * @param excludeArticleId Optional article ID to exclude from uniqueness check
     * @return A valid, unique slug
     */
    public String sanitizeAndValidateSlug(String userProvidedSlug, String title, UUID excludeArticleId) {
        String slug;
        
        // If user provided a slug, try to use it
        if (userProvidedSlug != null && !userProvidedSlug.trim().isEmpty()) {
            slug = generateSlug(userProvidedSlug); // Sanitize user input
            
            // If sanitized slug is valid, use it
            if (isValidSlug(slug)) {
                return generateUniqueSlug(slug, excludeArticleId);
            }
        }
        
        // Fallback: generate from title
        slug = generateSlug(title);
        return generateUniqueSlug(slug, excludeArticleId);
    }

    /**
     * Get a detailed validation error message for a slug.
     * 
     * @param slug The slug to validate
     * @return Error message, or null if valid
     */
    public String getValidationError(String slug) {
        if (slug == null || slug.isEmpty()) {
            return "Slug cannot be empty";
        }
        
        if (slug.length() > MAX_SLUG_LENGTH) {
            return "Slug must be at most " + MAX_SLUG_LENGTH + " characters";
        }
        
        if (!VALID_SLUG_PATTERN.matcher(slug).matches()) {
            return "Slug must contain only lowercase letters, numbers, and hyphens (no spaces or special characters)";
        }
        
        return null;
    }
}
