package com.memorio.backend.faces;

import com.memorio.backend.faces.FaceDataImportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/faces")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFaceController {
    private static final Logger logger = LoggerFactory.getLogger(AdminFaceController.class);
    private final FaceDataImportService faceDataImportService;
    private final PersonRepository personRepository;
    private final FaceImageRepository faceImageRepository;

    public AdminFaceController(FaceDataImportService faceDataImportService,
                               PersonRepository personRepository,
                               FaceImageRepository faceImageRepository){
        this.faceDataImportService = faceDataImportService;
        this.personRepository = personRepository;
        this.faceImageRepository = faceImageRepository;
    }
    @PostMapping("/import")
    public ResponseEntity<FaceDataImportService.ImportResult> importFaces(
            @RequestParam(defaultValue = "50") int maxPeople,
            @RequestParam(defaultValue = "true") boolean shuffle
    ){
        FaceDataImportService.ImportResult result = faceDataImportService.importFaceData(maxPeople, shuffle);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getImportStatus(){
        boolean hasData = faceDataImportService.isDataImported();
        long totalPersons = personRepository.count();
        long totalImages = faceImageRepository.count();
        long activePersons = personRepository.countByIsActiveTrue();

        Map<String, Object> status = Map.of(
                "hasData", hasData,
                "totalPersons", totalPersons,
                "totalImages", totalImages,
                "activePersons", activePersons,
                "difficultyBreakdown", Map.of(
                        "easy", personRepository.countByIsActiveTrueAndDifficultyLevel(1),
                        "medium", personRepository.countByIsActiveTrueAndDifficultyLevel(2),
                        "hard", personRepository.countByIsActiveTrueAndDifficultyLevel(3)
                )
        );

        return ResponseEntity.ok(status);

    }

    @GetMapping("/statistics")
    public ResponseEntity<FaceDataImportService.ImportStatistics> getStatistics(){
        FaceDataImportService.ImportStatistics stats = faceDataImportService.getImportStatistics();
        return ResponseEntity.ok(stats);
    }

    @PutMapping("/person/{personName}/activate")
    public ResponseEntity<Map<String,String>> activatePerson(@PathVariable String personName){
        return personRepository.findByPersonName(personName)
                .map(person -> {
                    person.setActive(true);
                    personRepository.save(person);
                    return ResponseEntity.ok(Map.of("status", "activated", "person", personName));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/person/{personName}/deactivate")
    public ResponseEntity<Map<String, String>> deactivatePerson(@PathVariable String personName){
        return personRepository.findByPersonName(personName)
                .map(person -> {
                    person.setActive(false);
                    personRepository.save(person);
                    return ResponseEntity.ok(Map.of("status", "deactivated", "person", personName));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/person")
    public ResponseEntity<?> uploadPerson(
            @RequestParam("displayName") String displayName,
            @RequestParam("difficultyLevel") int difficultyLevel,
            @RequestParam("images") List<MultipartFile> images
    ) {
        try {
            if (images == null || images.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "At least one image is required"));
            }

            if (images.size() > 10) {
                return ResponseEntity.badRequest().body(Map.of("error", "Maximum 10 images allowed"));
            }

            if (displayName == null || displayName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Display name is required"));
            }

            if (difficultyLevel < 1 || difficultyLevel > 3) {
                return ResponseEntity.badRequest().body(Map.of("error", "Difficulty level must be between 1 and 3"));
            }

            String personName = displayName.trim().replace(" ", "_");
            
            if (personRepository.findByPersonName(personName).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "A person with this name already exists"));
            }

            for (MultipartFile image : images) {
                if (image.getSize() > 10 * 1024 * 1024) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Each image must be less than 10MB"));
                }

                String contentType = image.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Only image files are allowed"));
                }
            }

            Person person = new Person(personName, displayName.trim(), difficultyLevel);
            person = personRepository.save(person);

            int imageCount = 0;
            for (int i = 0; i < images.size(); i++) {
                MultipartFile image = images.get(i);
                try {
                    byte[] imageData = image.getBytes();
                    String filename = personName + "_" + (i + 1) + getFileExtension(image.getOriginalFilename());
                    String contentType = image.getContentType();
                    
                    BufferedImage bufferedImage = ImageIO.read(image.getInputStream());
                    Integer width = bufferedImage != null ? bufferedImage.getWidth() : null;
                    Integer height = bufferedImage != null ? bufferedImage.getHeight() : null;

                    FaceImage faceImage = new FaceImage(person, filename, imageData, contentType);
                    faceImage.setWidth(width);
                    faceImage.setHeight(height);
                    faceImage.setPrimary(i == 0);
                    
                    faceImageRepository.save(faceImage);
                    imageCount++;
                } catch (IOException e) {
                    logger.error("Failed to process image: {}", image.getOriginalFilename(), e);
                }
            }

            if (imageCount == 0) {
                personRepository.delete(person);
                return ResponseEntity.badRequest().body(Map.of("error", "Failed to process any images"));
            }

            Map<String, Object> response = Map.of(
                "status", "success",
                "message", "Person uploaded successfully",
                "personName", personName,
                "displayName", displayName,
                "imageCount", imageCount,
                "difficultyLevel", difficultyLevel
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error uploading person", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload person: " + e.getMessage()));
        }
    }

    @GetMapping("/people")
    public ResponseEntity<List<Map<String, Object>>> getAllPeople() {
        List<Person> people = personRepository.findAll();
        List<Map<String, Object>> response = people.stream()
            .map(person -> {
                long imageCount = faceImageRepository.countByPersonId(person.getId());
                Map<String, Object> personMap = new HashMap<>();
                personMap.put("id", person.getId().toString());
                personMap.put("personName", person.getPersonName());
                personMap.put("displayName", person.getDisplayName());
                personMap.put("difficultyLevel", person.getDifficultyLevel());
                personMap.put("isActive", person.isActive());
                personMap.put("imageCount", imageCount);
                personMap.put("createdAt", person.getCreatedAt() != null ? person.getCreatedAt().toString() : null);
                return personMap;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/person/{personName}")
    public ResponseEntity<Map<String, String>> deletePerson(@PathVariable String personName) {
        return personRepository.findByPersonName(personName)
            .map(person -> {
                faceImageRepository.deleteByPersonId(person.getId());
                personRepository.delete(person);
                return ResponseEntity.ok(Map.of("status", "deleted", "person", personName));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return ".jpg";
        }
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0 && lastDot < filename.length() - 1) {
            return filename.substring(lastDot);
        }
        return ".jpg";
    }
}
