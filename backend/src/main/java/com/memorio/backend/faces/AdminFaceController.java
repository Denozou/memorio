package com.memorio.backend.faces;

import com.memorio.backend.faces.FaceDataImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/admin/faces")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFaceController {
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


}
