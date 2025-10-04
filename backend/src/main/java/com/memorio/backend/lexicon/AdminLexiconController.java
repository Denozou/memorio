package com.memorio.backend.lexicon;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/lexicon")
public class AdminLexiconController {
    private final LexiconImportService importer;
    public AdminLexiconController(LexiconImportService importer){
        this.importer = importer;
    }
    @PostMapping("/import/plain")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> importPlain(
            @RequestParam("file") MultipartFile file,
            @RequestParam(name = "lang", defaultValue = "en") String lang,
            @RequestParam(name = "pos", defaultValue = "NOUN") String pos
    ){
        var res = importer.importPlainList(file, lang, pos);
        return ResponseEntity.ok(new ImportResponse(
                "ok",
                lang,
                pos,
                res.totalLines(),
                res.inserted(),
                res.skipped()
        ));
    }
    public record ImportResponse(String status,
                                 String language,
                                 String pos,
                                 int totalLines,
                                 int inserted,
                                 int skipped){

    }
}
