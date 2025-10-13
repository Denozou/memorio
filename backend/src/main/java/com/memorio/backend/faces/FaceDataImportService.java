package com.memorio.backend.faces;

import com.memorio.backend.lexicon.LexiconImportService;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.nio.file.Path;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Stream;
//import java.util.logging.Logger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;

@Service
public class FaceDataImportService {

    private static final Logger logger = LoggerFactory.getLogger(FaceDataImportService.class);
    private final FaceImageRepository faceImageRepository;
    private final PersonRepository personRepository;

    @Value("${memorio.faces.dataset.path:/Users/antonkolenchuk/Downloads/backup_v2_before_oauth/lfw_funneled}")
    private String datasetPath;

    public FaceDataImportService(FaceImageRepository faceImageRepository,
                                 PersonRepository personRepository){
        this.faceImageRepository = faceImageRepository;
        this.personRepository = personRepository;
    }

    public ImportResult importFaceData(int maxPeople){
        return importFaceData(maxPeople, true);
    }

    public ImportResult importFaceData(int maxPeople, boolean shuffle){
        Objects.checkIndex(Math.max(1, maxPeople) - 1, Integer.MAX_VALUE);
        logger.info("Starting face data import from: {} (maxPeople={}, shuffle={}", datasetPath, maxPeople, shuffle);
        final Path datasetDir = Paths.get(datasetPath);
        if (!Files.exists(datasetDir) || !Files.isDirectory(datasetDir)){
            throw new IllegalStateException("Dataset directory not found: " + datasetPath);
        }

        final ImportResult batchResult = new ImportResult();
        try {
            final List<Path> remaining = unimportedPersonDirs(datasetDir);
            if(remaining.isEmpty()){
                logger.info("Nothing to import: all people appear to be in the database");
                return batchResult;
            }

            if (shuffle) Collections.shuffle(remaining);
            final List<Path> batch = remaining.subList(0,Math.min(maxPeople, remaining.size()));
            logger.info("Found {} unimported people. Importing this batch of {}", remaining.size(), batch.size());

            int processed = 0;
            for (Path personDir : batch){
                processed++;
                try{
                    ImportPersonResult personResult = importPerson(personDir);
                    batchResult.addPersonResult(personResult);
                    if (batchResult.getSuccessfulPeople() % 10 == 0){
                        logger.info("Imported {} people so far ({} processed in this batch)..", batchResult.getSuccessfulPeople(), processed);
                    }
                }catch (Exception e){
                    logger.error("Failed to import person from directory: {}", personDir, e);
                    batchResult.incrementFailedPeople();
                }

            }
        }catch (IOException e){
            throw new RuntimeException("Failed to read dataset directory", e);
        }
        logger.info("Face data import completed. Success: {}, Failed: {}, Total Images: {}",
                batchResult.getSuccessfulPeople(), batchResult.getFailedPeople(),
                batchResult.getTotalImages());

        return batchResult;
    }


    private List<Path> unimportedPersonDirs(Path datasetDir) throws IOException{
        Set<String> importedNames = new HashSet<>(personRepository.findAllPersonNames());
        try(Stream<Path> personDirs = Files.list(datasetDir)){
            return personDirs
                    .filter(Files::isDirectory)
                    .filter(path -> !path.getFileName().toString().startsWith(".")) //скіп прихованих папок
                    .filter(path -> !importedNames.contains(path.getFileName().toString()))
                    .sorted()
                    .toList();
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    protected ImportPersonResult importPerson(Path personDir) throws IOException{
        final String personName = personDir.getFileName().toString();
        final String displayName = formatDisplayName(personName);
        logger.debug("Importing person: {} ({})", personName, displayName);

        if (personRepository.findByPersonName(personName).isPresent()){
            logger.debug("Person {} already exists, skipping", personName);
            return new ImportPersonResult(personName, 0, "Already exists");
        }

        final  List<Path> imageFiles = getImageFiles(personDir);
        if (imageFiles.isEmpty()){
            throw new RuntimeException("No image files found for person: " + personName);
        }

        final int difficultyLevel = calculateDifficultyLevel(personName, imageFiles.size());

        Person person = new Person(personName, displayName, difficultyLevel);
        person = personRepository.save(person);

        int importedImages = 0;
        boolean hasPrimary = false;

        for (Path imageFile : imageFiles){
            try{
                FaceImage faceImage = createFaceImage(person, imageFile, !hasPrimary);
                faceImageRepository.save(faceImage);
                importedImages++;
                if (!hasPrimary) hasPrimary = true; // First successfully-saved image becomes primary.
            }catch (Exception e){
                logger.warn("Failed to import image: {}", imageFile, e);
            }
        }
        if (importedImages == 0){
            personRepository.delete(person);
            throw new RuntimeException("No images could be inported for person: " + personName);
        }

        logger.debug("Successfully imported person {} with {} images (difficulty: {})",
                personName, importedImages, difficultyLevel);
        return new ImportPersonResult(personName, importedImages, "Success");

    }


    private String formatDisplayName(String personName){
        return personName.replace("_", " ");
    }

    public static class ImportPersonResult{
        private final String personName;
        private final int imageCount;
        private final String status;

        public ImportPersonResult(String personName, int imageCount, String status){
            this.personName = personName;
            this.imageCount = imageCount;
            this.status = status;
        }

        public String getPersonName(){return personName;}
        public int getImageCount(){return imageCount;}
        public String getStatus(){return status;}
    }

    private List<Path> getImageFiles(Path personDir) throws IOException{
        try(Stream<Path> files = Files.list(personDir)){
            return files
                    .filter(Files::isRegularFile)
                    .filter(path -> {
                        String filename = path.getFileName().toString().toLowerCase(Locale.ROOT);
                        return filename.endsWith(".jpg") || filename.endsWith(".jpeg") ||
                                filename.endsWith(".png") || filename.endsWith(".bmp");
                    })
                    .sorted()
                    .toList();
        }
    }

    private int calculateDifficultyLevel(String personName, int imageCount){
        int difficulty = 1; // базовий рівень

        String[] nameParts = personName.split("_");
        if(nameParts.length > 2) difficulty++;
        int totalNameLength = personName.replace("_", " ").length();
        if(totalNameLength > 15) difficulty++;
        if (imageCount > 5)difficulty++;
        if( imageCount >10) difficulty++;

        if (ThreadLocalRandom.current().nextDouble() < 0.20) difficulty++;

        return Math.max(1, Math.min(3, difficulty));

    }

    private FaceImage createFaceImage(Person person, Path imageFile, boolean isPrimary) throws IOException{
        final String filename = imageFile.getFileName().toString();
        final byte[] imageData = Files.readAllBytes(imageFile);

        final BufferedImage bufferedImage = ImageIO.read(imageFile.toFile());
        final Integer width = (bufferedImage != null) ? bufferedImage.getWidth() : null;
        final Integer height = (bufferedImage != null) ? bufferedImage.getHeight() : null;

        final String contentType = detectContentType(imageFile, filename);
        FaceImage faceImage = new FaceImage(person, filename, imageData, contentType);
        faceImage.setWidth(width);
        faceImage.setHeight(height);
        faceImage.setPrimary(isPrimary);

        return faceImage;
    }

    private String detectContentType(Path imageFile, String filename){
        try{
            String probed = Files.probeContentType(imageFile);
            if(probed != null) return probed;
        } catch (IOException ignore){

        }

        final String lower = filename.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".bmp")) return "image/bmp";

        return "image/jpeg"; //default

    }

    public boolean isDataImported(){
        return personRepository.count() > 0;
    }

    public ImportStatistics getImportStatistics(){
        long totalPersons = personRepository.count();
        long totalImages = faceImageRepository.count();
        long easyPersons = personRepository.countByIsActiveTrueAndDifficultyLevel(1);
        long mediumPersons = personRepository.countByIsActiveTrueAndDifficultyLevel(2);
        long hardPersons = personRepository.countByIsActiveTrueAndDifficultyLevel(3);
        return new ImportStatistics(totalPersons, totalImages, easyPersons, mediumPersons, hardPersons);
    }
    public static class ImportResult{
        private int successfulPeople = 0;
        private int failedPeople = 0;
        private int totalImages = 0;

        private final List<ImportPersonResult> personResults = new ArrayList<>();

        public void addPersonResult (ImportPersonResult result){
            personResults.add(result);
            if("Success".equals(result.getStatus())){
                successfulPeople++;
                totalImages += result.getImageCount();
            }else{
                failedPeople++;
            }
        }

        public void incrementFailedPeople(){failedPeople++;}

        public int getSuccessfulPeople(){return successfulPeople;}
        public int getFailedPeople(){return failedPeople;}
        public int getTotalImages(){return totalImages;}
        public List<ImportPersonResult> getPersonResults(){return personResults;}
    }

    public static class ImportStatistics{
        private final long totalPersons;
        private final long totalImages;
        private final long easyPersons;
        private final long mediumPersons;
        private final long hardPersons;

        public ImportStatistics(long totalPersons, long totalImages, long easyPersons,
                                long mediumPersons, long hardPersons){
            this.totalPersons = totalPersons;
            this.totalImages = totalImages;
            this.easyPersons = easyPersons;
            this.mediumPersons = mediumPersons;
            this.hardPersons = hardPersons;
        }

        public long getTotalPersons(){return totalPersons;}
        public long getTotalImages(){return totalImages;}

        public long getEasyPersons(){return easyPersons;}
        public long getMediumPersons(){return mediumPersons;}
        public long getHardPersons(){return  hardPersons;}

    }



}


