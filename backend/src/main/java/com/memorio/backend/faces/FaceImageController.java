package com.memorio.backend.faces;

import org.apache.coyote.Response;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/faces")
@PreAuthorize("isAuthenticated")
public class FaceImageController {

    private final FaceImageRepository faceImageRepository;
    private final PersonRepository personRepository;

    public FaceImageController(FaceImageRepository faceImageRepository,
                               PersonRepository personRepository){
        this.faceImageRepository = faceImageRepository;
        this.personRepository = personRepository;
    }

    @GetMapping("/image/{personName}/{filename}")
    public ResponseEntity<byte[]> getFaceImage(@PathVariable String personName,
                                               @PathVariable String filename){
        if(personName.contains("..") || personName.contains("/") || personName.contains("\\")){
            return ResponseEntity.badRequest().build();
        }

        if(filename.contains("..") || filename.contains("/") || filename.contains("\\")){
            return ResponseEntity.badRequest().build();
        }

        Optional<FaceImage> faceImageOpt = faceImageRepository.findByPersonNameAndFilename(personName,filename);

        if(faceImageOpt.isEmpty()){
            return ResponseEntity.notFound().build();
        }

        FaceImage faceImage = faceImageOpt.get();

        if (faceImage.getPerson() == null || !faceImage.getPerson().isActive()){
            return ResponseEntity.notFound().build();
        }

        HttpHeaders headers = new HttpHeaders ();
        headers.setContentType(MediaType.parseMediaType(faceImage.getContentType()));
        headers.setContentLength(faceImage.getFileSize());
        headers.setCacheControl("public, max-age=86400");

        return new ResponseEntity<>(faceImage.getImageData(), headers, HttpStatus.OK);
    }
    @GetMapping("/primary/{personName}")
    public ResponseEntity<byte[]> getPrimaryFaceImage(@PathVariable String personName){
        if(personName.contains("..") || personName.contains("/") || personName.contains("\\")){
            return ResponseEntity.badRequest().build();
        }

        Optional<Person> personOpt = personRepository.findByPersonName(personName);
        if(personOpt.isEmpty() || !personOpt.get().isActive()){
            return ResponseEntity.notFound().build();
        }

        Optional<FaceImage> primaryImageOpt = faceImageRepository.findByPersonIdAndIsPrimaryTrue(personOpt.get().getId());
        if (primaryImageOpt.isEmpty()){
            return ResponseEntity.notFound().build();
        }

        FaceImage faceImage = primaryImageOpt.get();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(faceImage.getContentType()));
        headers.setContentLength(faceImage.getFileSize());
        headers.setCacheControl("public, max-age=86400");

        return new ResponseEntity<>(faceImage.getImageData(), headers, HttpStatus.OK);

    }
}
